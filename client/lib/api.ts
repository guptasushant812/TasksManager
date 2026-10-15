function resolveBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const trimmed = envUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (!trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
        return trimmed.replace(/\/+$/, '').replace(/\/api$/, '');
      }
    }
  }
  return '';
}

const BASE_URL = resolveBaseUrl();
type FetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('sessionAuthToken') : null;
  const isFormData = body instanceof FormData;
  const config: RequestInit = {
    method,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(sessionToken && { 'x-session-token': sessionToken }),
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
