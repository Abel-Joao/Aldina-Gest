import { Hono } from 'hono';
import nodemailer from 'nodemailer';

const GMAIL_USER = 'aldinagest@gmail.com';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || '';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });
}

// ─── Templates HTML ──────────────────────────────────────────────────────────

function templateBase(conteudo: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;}
  .wrap{max-width:580px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);}
  .header{background:linear-gradient(135deg,#6c63ff 0%,#4f46e5 100%);padding:36px 40px;text-align:center;}
  .header h1{margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:-0.5px;}
  .header p{margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px;}
  .body{padding:36px 40px;}
  .body p{margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;}
  .btn{display:inline-block;background:#6c63ff;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:600;font-size:15px;margin:8px 0 24px;}
  .box{background:#f8f7ff;border-left:4px solid #6c63ff;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;}
  .box p{margin:0;color:#374151;font-size:14px;}
  .box strong{color:#6c63ff;font-size:18px;letter-spacing:2px;}
  .footer{background:#f4f4f7;padding:24px 40px;text-align:center;}
  .footer p{margin:0;color:#9ca3af;font-size:12px;line-height:1.6;}
  .divider{height:1px;background:#e5e7eb;margin:24px 0;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Aldina Gest</h1>
    <p>Software de Gestão e Faturação</p>
  </div>
  <div class="body">
    ${conteudo}
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Aldina Gest · Angola<br/>
    Este email foi enviado automaticamente. Por favor não responda a este endereço.</p>
  </div>
</div>
</body>
</html>`;
}

function emailBoasVindas(nome: string, plano: string): { subject: string; html: string } {
  const subject = `Bem-vindo ao Aldina Gest, ${nome}!`;
  const html = templateBase(`
    <p>Olá <strong>${nome}</strong>,</p>
    <p>A sua conta foi criada com sucesso! Está agora no plano <strong>${plano}</strong>.</p>
    <p>Com o Aldina Gest pode gerir a sua empresa de forma simples e eficiente:</p>
    <ul style="color:#374151;font-size:15px;line-height:2;">
      <li>Emissão de faturas profissionais</li>
      <li>Controlo de stock e produtos</li>
      <li>Gestão de clientes</li>
      <li>Relatórios de vendas e despesas</li>
      <li>Ponto de venda (POS)</li>
    </ul>
    <div class="divider"></div>
    <p>Aceda à sua conta e comece agora:</p>
    <a class="btn" href="https://aldina-gest-production.up.railway.app/app">Entrar no Aldina Gest</a>
    <p style="font-size:13px;color:#6b7280;">Precisa de ajuda? Entre em contacto connosco a qualquer momento.</p>
  `);
  return { subject, html };
}

function emailTrialExpira(nome: string, dias: number): { subject: string; html: string } {
  const subject = `⚠️ O seu período experimental expira em ${dias} dia${dias !== 1 ? 's' : ''}`;
  const html = templateBase(`
    <p>Olá <strong>${nome}</strong>,</p>
    <p>O seu período de trial termina em <strong>${dias} dia${dias !== 1 ? 's' : ''}</strong>.</p>
    <p>Para continuar a utilizar todas as funcionalidades do Aldina Gest sem interrupções, adquira já a sua licença.</p>
    <div class="divider"></div>
    <p><strong>Planos disponíveis:</strong></p>
    <ul style="color:#374151;font-size:15px;line-height:2;">
      <li><strong>Mensal</strong> — flexibilidade total</li>
      <li><strong>Anual</strong> — melhor preço + faturação via WhatsApp (em breve)</li>
    </ul>
    <a class="btn" href="https://aldina-gest-production.up.railway.app/app">Activar Licença</a>
    <p style="font-size:13px;color:#6b7280;">Não perca o acesso aos seus dados. Active já!</p>
  `);
  return { subject, html };
}

function emailLicencaActivada(nome: string, plano: string, codigo: string): { subject: string; html: string } {
  const subject = `✅ Licença activada — Aldina Gest`;
  const html = templateBase(`
    <p>Olá <strong>${nome}</strong>,</p>
    <p>A sua licença foi activada com sucesso! Bem-vindo ao plano <strong>${plano}</strong>.</p>
    <div class="box">
      <p>Código activado:</p>
      <p><strong>${codigo}</strong></p>
    </div>
    <p>Agora tem acesso completo a todas as funcionalidades do Aldina Gest. Aproveite ao máximo!</p>
    <a class="btn" href="https://aldina-gest-production.up.railway.app/app">Ir para o Dashboard</a>
    <p style="font-size:13px;color:#6b7280;">Guarde este email como comprovativo de activação da sua licença.</p>
  `);
  return { subject, html };
}

function emailLicencaExpirada(nome: string): { subject: string; html: string } {
  const subject = `⚠️ A sua licença Aldina Gest expirou`;
  const html = templateBase(`
    <p>Olá <strong>${nome}</strong>,</p>
    <p>A sua licença do Aldina Gest <strong>expirou</strong>. O acesso às funcionalidades premium está suspenso.</p>
    <p>Para renovar e continuar a gerir o seu negócio sem interrupções:</p>
    <a class="btn" href="https://aldina-gest-production.up.railway.app/app">Renovar Licença</a>
    <div class="divider"></div>
    <p style="font-size:13px;color:#6b7280;">Os seus dados estão seguros e serão mantidos. Renove para voltar a aceder.</p>
  `);
  return { subject, html };
}

// ─── Rota ────────────────────────────────────────────────────────────────────

export const emailApp = new Hono()
  .basePath('/email')

  .post('/send', async (c) => {
    try {
      const body = await c.req.json() as {
        type: 'boas-vindas' | 'trial-expira' | 'licenca-activada' | 'licenca-expirada';
        to: string;
        nome: string;
        plano?: string;
        dias?: number;
        codigo?: string;
      };

      const { type, to, nome, plano = 'Trial', dias = 3, codigo = '' } = body;

      if (!to || !nome || !type) {
        return c.json({ error: 'Campos obrigatórios: type, to, nome' }, 400);
      }

      if (!GMAIL_PASS) {
        return c.json({ error: 'GMAIL_APP_PASSWORD não configurado no servidor' }, 500);
      }

      let email: { subject: string; html: string };

      switch (type) {
        case 'boas-vindas':
          email = emailBoasVindas(nome, plano);
          break;
        case 'trial-expira':
          email = emailTrialExpira(nome, dias);
          break;
        case 'licenca-activada':
          email = emailLicencaActivada(nome, plano, codigo);
          break;
        case 'licenca-expirada':
          email = emailLicencaExpirada(nome);
          break;
        default:
          return c.json({ error: 'Tipo de email inválido' }, 400);
      }

      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Aldina Gest" <${GMAIL_USER}>`,
        to,
        subject: email.subject,
        html: email.html,
      });

      return c.json({ ok: true, type, to });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[email] Erro ao enviar:', msg);
      return c.json({ error: msg }, 500);
    }
  })

  // Teste rápido (só em dev)
  .get('/test', async (c) => {
    const to = c.req.query('to');
    const type = (c.req.query('type') || 'boas-vindas') as any;
    if (!to) return c.json({ error: 'Passa ?to=email&type=boas-vindas' }, 400);

    const res = await fetch(`${c.req.url.split('/email')[0]}/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to, nome: 'Teste', plano: 'Mensal', dias: 3, codigo: 'TEST-1234' }),
    });
    const data = await res.json();
    return c.json(data);
  });
