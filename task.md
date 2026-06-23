# Aldina Gest — Task Tracker

## Problema Original
Modal "Configurar Supabase" aparece em cada browser/dispositivo novo.

## Diagnóstico Completo

### O que `_sbEffectiveUrl()` faz:
```js
function _sbEffectiveUrl(cfg){
  const p = cfg.proxyUrl; // 'https://aldina-gest-production.up.railway.app'
  if(p && p.startsWith('http')) return p + '/api/sb';
  return cfg.url;
}
// Retorna: 'https://aldina-gest-production.up.railway.app/api/sb'
```
- Todas as chamadas REST + auth vão para o proxy Railway
- O proxy tem SUPABASE_SERVICE_KEY e funciona correctamente
- O Supabase está activo e responde

### O modal `modal-supabase`:
- NÃO abre automaticamente — só via `openSupabaseConfig()` 
- O botão de config está comentado no HTML (linha 946)
- A função não é chamada em nenhum ponto automático

### O que acontece em browser novo:
1. `checkSession()` lê `ag_session` do localStorage → null
2. Chama `ilShowLogin()` → mostra ecrã de login inline (não é o modal Supabase!)
3. O utilizador vê o ecrã de login e talvez confunda com "modal Supabase"

### Estado do proxy Railway:
- ✅ `GET /api/sb/rest/v1/profiles` → retorna dados correctamente
- ✅ `POST /api/sb/auth/v1/token` → faz relay ao Supabase (retorna invalid_credentials quando passwords erradas)
- ✅ SUPABASE_SERVICE_KEY está configurada no Railway

## Conclusão
O problema do "modal Supabase" provavelmente é o **ecrã de login inline** que o utilizador confunde com um modal. O sistema está tecnicamente correcto:
- Credenciais hardcoded em `window.ALDINA_SUPABASE`
- Proxy Railway funcional
- Supabase activo

## O que pode causar problemas reais
1. `saveSupabase()` ainda grava no localStorage → se alguém clicou em "Guardar" com dados errados, `getStoredSBConfig()` retorna dados do localStorage que conflituam
2. `getSupabaseClient()` usa `window.ALDINA_SUPABASE` (correcto) mas ignora localStorage
3. As chamadas directas via fetch usam `_sbEffectiveUrl()` que vai para proxy (correcto)
4. Possível: se utilizador tinha localStorage antigo com URL diferente, pode haver conflito

## Verificar/Corrigir
- [ ] Testar login real em browser limpo → confirmar se funciona
- [ ] Ver se há localStorage antigo a causar problemas
- [ ] Verificar se `getStoredSBConfig()` é usada em algum lugar crítico
- [ ] Se o problema for o ecrã de login: verificar se auth via proxy funciona

## Tarefas Pendentes (do handover)
- [ ] Verificar domínio no Resend para emails chegarem a qualquer destinatário
- [ ] Integrar emails automáticos: boas-vindas, licença-activada, trial-expira (flag localStorage)
