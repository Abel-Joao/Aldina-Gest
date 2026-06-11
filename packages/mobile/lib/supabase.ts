// Cliente Supabase leve via proxy
const PROXY_BASE = 'https://aldinap-76zid5k-preview-4200.runable.site/api/sb';

export async function sbFetch(path: string, options: RequestInit = {}) {
  const url = `${PROXY_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res;
}

// Helper REST para tabelas
export function rest(table: string, query = '') {
  return `${PROXY_BASE}/rest/v1/${table}${query ? `?${query}` : ''}`;
}

export async function dbGet<T>(table: string, query = ''): Promise<T[]> {
  const res = await fetch(rest(table, query), {
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function dbPost<T>(table: string, body: object): Promise<T> {
  const res = await fetch(rest(table), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function dbPatch<T>(table: string, filter: string, body: object): Promise<T> {
  const res = await fetch(rest(table, filter), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function dbDelete(table: string, filter: string): Promise<void> {
  const res = await fetch(rest(table, filter), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(await res.text());
}
