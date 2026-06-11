/**
 * Aldina Gest — WhatsApp Faturação Automática (Plano Anual)
 * Webhook que recebe mensagens WhatsApp, interpreta via IA e cria faturas.
 */

import { Hono } from 'hono';
import OpenAI from 'openai';

const SUPABASE_URL = 'https://adzslgrktdundlozmcoa.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const WA_TOKEN = process.env.WA_TOKEN || '';           // Meta WhatsApp token
const WA_PHONE_ID = process.env.WA_PHONE_ID || '';     // Phone Number ID
const WA_VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || 'aldinagest2025';
const OPENAI_KEY = process.env.OPENAI_KEY || '';

// ─── Helpers Supabase ────────────────────────────────────────────────────────
async function sbGet(path: string) {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, Accept: 'application/json' }
  });
  return r.json();
}
async function sbPost(path: string, body: unknown, method = 'POST') {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body)
  });
  return r.json();
}

// ─── Helpers WhatsApp ────────────────────────────────────────────────────────
async function waSend(to: string, text: string) {
  await fetch(`https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } })
  });
}

// ─── Geração de número de fatura ─────────────────────────────────────────────
function gerarNumeroFatura(ano: number, seq: number) {
  return `FAT-${ano}-${String(seq).padStart(4, '0')}`;
}

// ─── IA — interpretar mensagem e extrair dados da fatura ─────────────────────
async function interpretarMensagem(mensagem: string, produtos: ProdutoSB[]): Promise<FaturaAI | null> {
  if (!OPENAI_KEY) return null;
  const openai = new OpenAI({ apiKey: OPENAI_KEY });

  const catalogoStr = produtos.map(p => `- ${p.nome} (ref: ${p.ref || p.id}, preço: ${p.preco} Kz, IVA: ${p.iva || 14}%)`).join('\n');

  const prompt = `És um assistente de faturação para Angola. O cliente enviou a seguinte mensagem pelo WhatsApp:
"${mensagem}"

Catálogo de produtos disponíveis:
${catalogoStr || '(sem produtos cadastrados)'}

Extrai os dados para criar uma fatura. Responde APENAS com JSON válido neste formato:
{
  "cliente_nome": "nome do cliente ou null se não mencionado",
  "cliente_nif": "NIF ou null",
  "cliente_email": "email ou null",
  "cliente_telefone": "telefone ou null",
  "itens": [
    { "produto_ref": "ref ou nome do produto", "descricao": "descrição", "quantidade": 1, "preco_unit": 0, "iva": 14 }
  ],
  "observacoes": "observações ou null",
  "confianca": "alta|media|baixa"
}

Se não conseguires identificar produtos, usa os nomes mencionados com preço 0 para o operador preencher.`;

  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });
    const content = resp.choices[0]?.message?.content || '{}';
    return JSON.parse(content) as FaturaAI;
  } catch (e) {
    console.error('OpenAI error:', e);
    return null;
  }
}

// ─── Criar fatura no Supabase ─────────────────────────────────────────────────
async function criarFatura(dados: FaturaAI, userId: string, telefoneCliente: string): Promise<FaturaCriada> {
  const ano = new Date().getFullYear();

  // Buscar último número de fatura
  const faturas = await sbGet(`/rest/v1/faturas?user_id=eq.${userId}&order=created_at.desc&limit=1&select=numero`);
  let seq = 1;
  if (Array.isArray(faturas) && faturas.length > 0 && faturas[0].numero) {
    const match = faturas[0].numero.match(/(\d+)$/);
    if (match) seq = parseInt(match[1]) + 1;
  }

  const numero = gerarNumeroFatura(ano, seq);
  const now = new Date().toISOString().split('T')[0];

  // Calcular totais
  const itens = (dados.itens || []).map((item, i) => ({
    id: `item-${i + 1}`,
    descricao: item.descricao || item.produto_ref,
    quantidade: Number(item.quantidade) || 1,
    preco_unit: Number(item.preco_unit) || 0,
    iva: Number(item.iva) || 14,
    total: (Number(item.quantidade) || 1) * (Number(item.preco_unit) || 0)
  }));

  const subtotal = itens.reduce((s, i) => s + i.total, 0);
  const totalIva = itens.reduce((s, i) => s + (i.total * i.iva / 100), 0);
  const total = subtotal + totalIva;

  const fatura = {
    id: `waf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    numero,
    data: now,
    vencimento: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    estado: 'pendente',
    cliente_nome: dados.cliente_nome || 'Cliente WhatsApp',
    cliente_nif: dados.cliente_nif || '',
    cliente_email: dados.cliente_email || '',
    cliente_telefone: dados.cliente_telefone || telefoneCliente,
    itens: JSON.stringify(itens),
    subtotal,
    total_iva: totalIva,
    total,
    moeda: 'AOA',
    observacoes: dados.observacoes || `Fatura criada via WhatsApp (${telefoneCliente})`,
    user_id: userId,
    origem: 'whatsapp',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await sbPost('/rest/v1/faturas', fatura);
  return { fatura, itens };
}

// ─── Formatar resumo para WhatsApp ───────────────────────────────────────────
function formatarResumo(f: ReturnType<typeof criarFatura> extends Promise<infer T> ? T : never): string {
  const { fatura, itens } = f;
  const linhas = itens.map((i: FaturaItem) =>
    `  • ${i.descricao} x${i.quantidade} = ${i.total.toLocaleString('pt-AO')} Kz`
  ).join('\n');

  return `✅ *Fatura criada com sucesso!*

📄 *Nº:* ${fatura.numero}
📅 *Data:* ${fatura.data}
👤 *Cliente:* ${fatura.cliente_nome}

*Itens:*
${linhas}

💰 *Subtotal:* ${fatura.subtotal.toLocaleString('pt-AO')} Kz
🧾 *IVA:* ${fatura.total_iva.toLocaleString('pt-AO')} Kz
✅ *TOTAL: ${fatura.total.toLocaleString('pt-AO')} Kz*

_Fatura registada no Aldina Gest. Para aceder: aldinap-76zid5k.runable.site_`;
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface ProdutoSB { id: string; nome: string; ref?: string; preco: number; iva?: number; }
interface FaturaItem { descricao: string; quantidade: number; preco_unit: number; iva: number; total: number; }
interface FaturaAI {
  cliente_nome?: string; cliente_nif?: string; cliente_email?: string; cliente_telefone?: string;
  itens: { produto_ref: string; descricao: string; quantidade: number; preco_unit: number; iva: number; }[];
  observacoes?: string; confianca?: string;
}
interface FaturaCriada { fatura: Record<string, unknown>; itens: FaturaItem[]; }

// ─── Sessões de conversa (em memória) ────────────────────────────────────────
const sessoes = new Map<string, { userId: string; step: string; dados?: Partial<FaturaAI> }>();

// ─── Router ──────────────────────────────────────────────────────────────────
export const waApp = new Hono()

  // Verificação do webhook (Meta exige GET com challenge)
  .get('/webhook/whatsapp', (c) => {
    const mode = c.req.query('hub.mode');
    const token = c.req.query('hub.verify_token');
    const challenge = c.req.query('hub.challenge');
    if (mode === 'subscribe' && token === WA_VERIFY_TOKEN) {
      return c.text(challenge || '', 200);
    }
    return c.text('Forbidden', 403);
  })

  // Receber mensagens do WhatsApp
  .post('/webhook/whatsapp', async (c) => {
    try {
      const body = await c.req.json() as Record<string, unknown>;

      const entry = (body.entry as unknown[])?.[0] as Record<string, unknown>;
      const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
      const value = changes?.value as Record<string, unknown>;
      const messages = value?.messages as Record<string, unknown>[];

      if (!messages?.length) return c.json({ ok: true }, 200);

      const msg = messages[0];
      const from = msg.from as string;
      const tipo = msg.type as string;

      let texto = '';
      if (tipo === 'text') {
        texto = ((msg.text as Record<string, string>)?.body || '').trim();
      } else if (tipo === 'interactive') {
        const interactive = msg.interactive as Record<string, unknown>;
        texto = ((interactive?.button_reply as Record<string, string>)?.title) ||
                ((interactive?.list_reply as Record<string, string>)?.title) || '';
      }

      if (!texto) return c.json({ ok: true }, 200);

      // Verificar se este número tem sessão ativa ou encontrar user
      const sessao = sessoes.get(from);

      // Buscar utilizador pelo telefone no Supabase
      let userId = sessao?.userId || '';
      if (!userId) {
        const perfis = await sbGet(`/rest/v1/profiles?or=(telefone.eq.${from},telefone.eq.%2B${from})&limit=1&select=id,plano,status`);
        if (Array.isArray(perfis) && perfis.length > 0) {
          const p = perfis[0];
          // Verificar se tem plano anual
          if (p.plano !== 'anual' && p.status !== 'active') {
            await waSend(from, '⚠️ A faturação automática via WhatsApp está disponível apenas no *Plano Anual* do Aldina Gest.\n\nActualize o seu plano em: aldinap-76zid5k.runable.site');
            return c.json({ ok: true }, 200);
          }
          userId = p.id;
        } else {
          await waSend(from, '❌ Número não associado a nenhuma conta Aldina Gest.\n\nRegiste-se em: aldinap-76zid5k.runable.site');
          return c.json({ ok: true }, 200);
        }
      }

      // Comandos especiais
      if (['cancelar', 'cancel', 'sair', 'stop'].includes(texto.toLowerCase())) {
        sessoes.delete(from);
        await waSend(from, '❌ Operação cancelada.');
        return c.json({ ok: true }, 200);
      }

      // Buscar produtos do utilizador
      const produtos = await sbGet(`/rest/v1/produtos?user_id=eq.${userId}&select=id,nome,ref,preco,iva`) as ProdutoSB[];

      // Interpretar mensagem com IA
      await waSend(from, '🤖 A processar o seu pedido...');
      const dadosAI = await interpretarMensagem(texto, Array.isArray(produtos) ? produtos : []);

      if (!dadosAI || !dadosAI.itens?.length) {
        await waSend(from, '❓ Não consegui perceber o pedido. Por favor descreva os produtos e quantidades.\n\nExemplo: _"2 caixas de água mineral + 3 sabões"_');
        return c.json({ ok: true }, 200);
      }

      // Criar fatura
      const resultado = await criarFatura(dadosAI, userId, from);
      const resumo = formatarResumo(resultado);

      await waSend(from, resumo);

      // Se confiança baixa, avisar operador
      if (dadosAI.confianca === 'baixa') {
        await waSend(from, '⚠️ Alguns itens podem precisar de revisão. Verifique a fatura no sistema.');
      }

      sessoes.delete(from);

    } catch (e) {
      console.error('WA webhook error:', e);
    }

    return c.json({ ok: true }, 200);
  })

  // Status do serviço
  .get('/whatsapp/status', (c) => {
    return c.json({
      ok: true,
      configured: !!(WA_TOKEN && WA_PHONE_ID && OPENAI_KEY),
      wa_phone_id: WA_PHONE_ID ? '✓ configurado' : '✗ em falta',
      openai: OPENAI_KEY ? '✓ configurado' : '✗ em falta',
    }, 200);
  });
