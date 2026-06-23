import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { waApp } from './whatsapp';
import { emailApp } from './email';

const SUPABASE_URL = 'https://adzslgrktdundlozmcoa.supabase.co';
// Usar service_role no proxy para bypass RLS (o proxy é o ponto de segurança)
const SUPABASE_SVC_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const app = new Hono()
  .basePath('api')
  .use(
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'apikey', 'x-client-info', 'x-supabase-api-version', 'prefer'],
      exposeHeaders: ['Content-Range', 'Range'],
      credentials: false,
      maxAge: 3600,
    })
  )
  .get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }, 200))
  .get('/health', (c) => c.json({ status: 'ok' }, 200))

  // Endpoint de migration (protegido por secret interno)
  .get('/migrate/telefone', async (c) => {
    const secret = c.req.query('secret');
    if (secret !== 'aldina-migrate-2025') return c.json({ error: 'Forbidden' }, 403);
    const SVC = process.env.SUPABASE_SERVICE_KEY || '';
    const check = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=telefone&limit=1`, {
      headers: { apikey: SVC, Authorization: `Bearer ${SVC}` }
    });
    if (check.ok) return c.json({ ok: true, msg: 'Coluna telefone já existe' }, 200);
    return c.json({ ok: false, msg: 'Coluna não existe. Execute manualmente no Supabase Dashboard: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefone text;' }, 200);
  })

  // Migration: criar tabela caixa
  .get('/migrate/caixa', async (c) => {
    const secret = c.req.query('secret');
    if (secret !== 'aldina-migrate-2025') return c.json({ error: 'Forbidden' }, 403);
    const SVC = process.env.SUPABASE_SERVICE_KEY || '';
    // Verificar se já existe
    const check = await fetch(`${SUPABASE_URL}/rest/v1/caixa?limit=1`, {
      headers: { apikey: SVC, Authorization: `Bearer ${SVC}` }
    });
    if (check.ok) return c.json({ ok: true, msg: 'Tabela caixa já existe' }, 200);
    // Criar via SQL
    const sql = `CREATE TABLE IF NOT EXISTS caixa (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid REFERENCES auth.users(id), data date NOT NULL, abertura numeric DEFAULT 0, fechamento numeric, status text DEFAULT 'aberta', totalVendas numeric, notas text, created_at timestamptz DEFAULT now());`;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json', Prefer: 'params=single-object' },
      body: JSON.stringify({ query: sql })
    });
    return c.json({ ok: false, msg: 'Execute no Supabase Dashboard: ' + sql }, 200);
  })

  // Proxy: qualquer caminho sob /api/sb/* é encaminhado ao Supabase
  .all('/sb/*', async (c) => {
    const method = c.req.method.toUpperCase();

    // Remove o prefixo /api/sb do path
    const subpath = c.req.path.replace(/^\/api\/sb/, '');
    const search = new URL(c.req.url).search;
    const targetUrl = `${SUPABASE_URL}${subpath}${search}`;

    // Copiar headers relevantes — substituir apikey/authorization pela service_role key
    // para bypass RLS (o proxy é o ponto de controlo de acesso)
    const reqHeaders: Record<string, string> = {
      apikey: SUPABASE_SVC_KEY,
      Authorization: `Bearer ${SUPABASE_SVC_KEY}`,
    };
    for (const [key, val] of Object.entries(c.req.header())) {
      const lower = key.toLowerCase();
      if (
        lower === 'content-type' ||
        lower === 'x-client-info' ||
        lower === 'x-supabase-api-version' ||
        lower === 'prefer'
      ) {
        reqHeaders[key] = val;
      }
    }

    // Ler body apenas para métodos que suportam (nunca DELETE nem GET)
    let body: BodyInit | undefined;
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        const text = await c.req.text();
        // Só enviar body se tiver conteúdo
        if (text && text.trim().length > 0) {
          body = text;
          // Garantir content-type JSON se não definido
          if (!reqHeaders['content-type'] && !reqHeaders['Content-Type']) {
            reqHeaders['Content-Type'] = 'application/json';
          }
        }
      } catch {
        body = undefined;
      }
    }

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: reqHeaders,
      };

      // Só adicionar body para POST/PUT/PATCH com conteúdo
      if (body !== undefined) {
        fetchOptions.body = body;
      }

      const resp = await fetch(targetUrl, fetchOptions);

      const respBody = await resp.arrayBuffer();
      const respHeaders: Record<string, string> = {};
      resp.headers.forEach((val, key) => {
        const lower = key.toLowerCase();
        if (
          lower === 'content-type' ||
          lower === 'content-range' ||
          lower === 'x-supabase-api-version'
        ) {
          respHeaders[key] = val;
        }
      });

      return new Response(respBody, {
        status: resp.status,
        headers: respHeaders,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return c.json({ error: 'Proxy error', detail: msg }, 502);
    }
  });

// Montar rotas WhatsApp
const appWithWa = app.route('/', waApp);

// Montar rotas Email
const appWithEmail = appWithWa.route('/', emailApp);

export type AppType = typeof appWithEmail;
export default appWithEmail;
