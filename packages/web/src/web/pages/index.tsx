import { useState } from 'react';

const features = [
  {
    icon: '🧾',
    title: 'Faturação Completa',
    desc: 'Faturas, recibos, notas de crédito e proformas com geração de PDF em segundos.',
  },
  {
    icon: '📦',
    title: 'Gestão de Stock',
    desc: 'Controlo de entradas, saídas e ajustes. Alertas de stock mínimo automáticos.',
  },
  {
    icon: '👥',
    title: 'Clientes & Fornecedores',
    desc: 'Base de contactos completa com histórico de transacções e saldos em aberto.',
  },
  {
    icon: '💰',
    title: 'Caixa & Pagamentos',
    desc: 'Abertura e fecho de caixa, múltiplas moedas (AOA/USD/EUR) e métodos de pagamento.',
  },
  {
    icon: '📊',
    title: 'Relatórios & P&L',
    desc: 'Dashboard com KPIs em tempo real, balanço e demonstração de resultados exportável.',
  },
  {
    icon: '☁️',
    title: 'Sincronização Cloud',
    desc: 'Dados guardados localmente e sincronizados automaticamente com a cloud.',
  },
];

const plans = [
  {
    name: 'Mensal',
    price: '5.000',
    currency: 'AOA',
    period: '/mês',
    highlight: false,
    features: [
      'Faturação ilimitada',
      'Gestão de stock',
      'Clientes e fornecedores',
      'Relatórios básicos',
      'Sincronização cloud',
      'Suporte por email',
    ],
  },
  {
    name: 'Anual',
    price: '50.000',
    currency: 'AOA',
    period: '/ano',
    badge: '2 meses grátis',
    highlight: true,
    features: [
      'Tudo do plano mensal',
      'Relatórios avançados & P&L',
      'Exportação PDF/Excel',
      'Multi-utilizador',
      'Faturação via WhatsApp (IA) ✨',
      'Suporte prioritário',
    ],
  },
];

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#1a1a2e', overflowX: 'hidden' }}>
      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e8e7f5',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px,5vw,80px)', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg,#06458d,#3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 16,
          }}>A</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>Aldina<span style={{ color: '#06458d' }}>Gest</span></span>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="nav-links">
          {['Funcionalidades', 'Preços', 'Sobre'].map(link => (
            <a key={link} href={`#${link.toLowerCase()}`} style={{
              color: '#444', textDecoration: 'none', fontSize: 14, fontWeight: 500,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#06458d')}
              onMouseLeave={e => (e.currentTarget.style.color = '#444')}
            >{link}</a>
          ))}
          <a href="/app" style={{
            background: '#06458d', color: '#fff', padding: '9px 22px',
            borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600,
            transition: 'background .2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0559b8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#06458d')}
          >Entrar na App</a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#1a1a2e' }}
          className="hamburger"
          aria-label="Menu"
        >☰</button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
          background: '#fff', borderBottom: '1px solid #e8e7f5',
          padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {['Funcionalidades', 'Preços', 'Sobre'].map(link => (
            <a key={link} href={`#${link.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              style={{ color: '#444', textDecoration: 'none', fontSize: 16, fontWeight: 500 }}>{link}</a>
          ))}
          <a href="/app" style={{
            background: '#06458d', color: '#fff', padding: '12px 0', textAlign: 'center',
            borderRadius: 8, textDecoration: 'none', fontSize: 15, fontWeight: 600,
          }}>Entrar na App</a>
        </div>
      )}

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(160deg, #f0f4ff 0%, #e8f0fe 50%, #f5f0ff 100%)',
        minHeight: '92vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', textAlign: 'center',
        padding: 'clamp(60px,10vh,120px) clamp(20px,5vw,80px)',
      }}>
        <div style={{
          display: 'inline-block',
          background: '#e8f0fe', color: '#06458d',
          padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
          marginBottom: 24, border: '1px solid #c7d9fb',
        }}>
          🇦🇴 Feito para empresas angolanas
        </div>

        <h1 style={{
          fontSize: 'clamp(36px,6vw,72px)', fontWeight: 800,
          lineHeight: 1.1, letterSpacing: '-1.5px',
          margin: '0 0 24px',
          background: 'linear-gradient(135deg,#06458d 0%,#3b82f6 60%,#8b5cf6 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Gira o teu negócio<br />sem complicações
        </h1>

        <p style={{
          fontSize: 'clamp(16px,2vw,20px)', color: '#5c5a68',
          maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.65,
        }}>
          Faturação, stock, clientes e relatórios — tudo num só lugar.
          Simples, rápido e pensado para a realidade angolana.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/app" style={{
            background: 'linear-gradient(135deg,#06458d,#3b82f6)',
            color: '#fff', padding: '15px 36px', borderRadius: 10,
            textDecoration: 'none', fontSize: 16, fontWeight: 700,
            boxShadow: '0 8px 24px rgba(6,69,141,0.3)',
            transition: 'transform .2s, box-shadow .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(6,69,141,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(6,69,141,0.3)'; }}
          >
            Começar agora — é grátis
          </a>
          <a href="#funcionalidades" style={{
            background: '#fff', color: '#06458d', padding: '15px 36px', borderRadius: 10,
            textDecoration: 'none', fontSize: 16, fontWeight: 600,
            border: '1.5px solid #c7d9fb',
          }}>
            Ver funcionalidades
          </a>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 'clamp(24px,4vw,60px)', marginTop: 64, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {[
            { val: '100%', label: 'Offline & Online' },
            { val: 'AOA/USD/EUR', label: 'Multi-moeda' },
            { val: 'PDF', label: 'Exportação nativa' },
          ].map(s => (
            <div key={s.val} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#06458d' }}>{s.val}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,80px)', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 12px' }}>
              Tudo o que precisas
            </h2>
            <p style={{ color: '#888', fontSize: 17 }}>Uma plataforma completa para gerir o teu negócio do início ao fim.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {features.map(f => (
              <div key={f.title} style={{
                background: '#f8f8fc', borderRadius: 14, padding: '28px 26px',
                border: '1px solid #eeecf8',
                transition: 'transform .2s, box-shadow .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(6,69,141,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: 17, margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="preços" style={{
        padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,80px)',
        background: 'linear-gradient(160deg,#f0f4ff,#f5f0ff)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 12px' }}>
              Preços simples e transparentes
            </h2>
            <p style={{ color: '#888', fontSize: 17 }}>Sem surpresas. Sem comissões escondidas.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {plans.map(p => (
              <div key={p.name} style={{
                background: p.highlight ? 'linear-gradient(135deg,#06458d,#3b82f6)' : '#fff',
                color: p.highlight ? '#fff' : '#1a1a2e',
                borderRadius: 16, padding: '36px 32px',
                border: p.highlight ? 'none' : '1.5px solid #e0ddf0',
                boxShadow: p.highlight ? '0 20px 60px rgba(6,69,141,0.35)' : '0 4px 20px rgba(0,0,0,0.06)',
                position: 'relative',
                transform: p.highlight ? 'scale(1.03)' : 'scale(1)',
              }}>
                {p.badge && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: '#f59e0b', color: '#fff',
                    padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}>{p.badge}</div>
                )}
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 'clamp(32px,5vw,46px)', fontWeight: 800 }}>{p.price}</span>
                  <span style={{ fontSize: 14, opacity: 0.75 }}>{p.currency}</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 28 }}>{p.period}</div>

                <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0 }}>
                  {p.features.map(feat => (
                    <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: 14 }}>
                      <span style={{ color: p.highlight ? '#86efac' : '#06458d', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span style={{ opacity: p.highlight ? 1 : 0.85 }}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <a href="/app" style={{
                  display: 'block', textAlign: 'center',
                  background: p.highlight ? 'rgba(255,255,255,0.2)' : '#06458d',
                  color: '#fff', padding: '13px 0', borderRadius: 9,
                  textDecoration: 'none', fontSize: 15, fontWeight: 700,
                  border: p.highlight ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
                  transition: 'opacity .2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Começar agora
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="sobre" style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,80px)', background: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 20px' }}>
            Construído para Angola
          </h2>
          <p style={{ fontSize: 17, color: '#666', lineHeight: 1.7, marginBottom: 16 }}>
            O <strong>AldinaGest</strong> foi desenvolvido a pensar nas pequenas e médias empresas angolanas —
            da loja de bairro ao escritório de contabilidade. Funciona offline, suporta kwanzas,
            e gera documentos prontos para a AGT.
          </p>
          <p style={{ fontSize: 15, color: '#888', lineHeight: 1.7 }}>
            Desenvolvido em Angola 🇦🇴 · Suporte em Português · Actualização contínua
          </p>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section style={{
        background: 'linear-gradient(135deg,#06458d 0%,#3b82f6 100%)',
        padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,80px)',
        textAlign: 'center', color: '#fff',
      }}>
        <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.5px' }}>
          Pronto para começar?
        </h2>
        <p style={{ fontSize: 17, opacity: 0.85, marginBottom: 36 }}>
          Começa hoje sem compromisso. A tua primeira fatura em menos de 2 minutos.
        </p>
        <a href="/app" style={{
          display: 'inline-block',
          background: '#fff', color: '#06458d', padding: '16px 44px',
          borderRadius: 10, textDecoration: 'none', fontSize: 17, fontWeight: 800,
          boxShadow: '0 8px 28px rgba(0,0,0,0.2)',
          transition: 'transform .2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          Entrar na App →
        </a>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#0f172a', color: '#64748b',
        padding: '28px clamp(20px,5vw,80px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg,#06458d,#3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 13,
          }}>A</div>
          <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>AldinaGest</span>
        </div>
        <span style={{ fontSize: 13 }}>© {new Date().getFullYear()} AldinaGest · Feito em Angola 🇦🇴</span>
        <a href="/app" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: 13 }}>Abrir App</a>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .nav-links { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>
    </div>
  );
}
