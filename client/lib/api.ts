// The Next.js frontend will proxy API requests to the backend via next.config.ts rewrites.
const BASE_URL = '';
type FetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const isFormData = body instanceof FormData;
  const config: RequestInit = {
    method,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...headers,
    },
  };

  if (body !== undefined) {
    config.body = isFormData ? (body as any) : JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, config);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const errorMessage = err.message || err.error || (res.statusText ? `${res.status} ${res.statusText}` : `Request failed with status ${res.status}`);
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

export function buildQueryString(params: Record<string, string | number | undefined | null>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export { BASE_URL };
