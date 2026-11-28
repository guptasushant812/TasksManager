import { lockSession, STORAGE_KEYS } from './sessionManager';

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
  signal?: AbortSignal;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options;

  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN) : null;
  const passwordUpdatedAt = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.PASSWORD_UPDATED_AT) : null;
  const isFormData = body instanceof FormData;
  const config: RequestInit = {
    method,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      'x-requested-with': 'XMLHttpRequest',
      ...(sessionToken && { 'x-session-token': sessionToken }),
      ...(passwordUpdatedAt && { 'x-password-updated-at': passwordUpdatedAt }),
      ...headers,
    },
    credentials: 'include',
    signal,
  };

  if (body !== undefined) {
    config.body = isFormData ? (body as any) : JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, config);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        const isPasswordChanged = err.error === 'PASSWORD_CHANGED';
        const isSessionExpired = err.error === 'SESSION_EXPIRED';
        lockSession(isPasswordChanged ? 'manual' : isSessionExpired ? 'timeout' : 'manual');
        if (isPasswordChanged) {
          localStorage.removeItem(STORAGE_KEYS.PASSWORD_UPDATED_AT);
        }
      }
    }
    const errorMessage = err.message || err.error || (res.statusText ? `${res.status} ${res.statusText}` : `Request failed with status ${res.status}`);
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

export async function apiFetchRaw(path: string, options: FetchOptions = {}): Promise<Response> {
  const { method = 'GET', body, headers = {}, signal } = options;

  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN) : null;
  const passwordUpdatedAt = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.PASSWORD_UPDATED_AT) : null;
  const isFormData = body instanceof FormData;
  const config: RequestInit = {
    method,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      'x-requested-with': 'XMLHttpRequest',
      ...(sessionToken && { 'x-session-token': sessionToken }),
      ...(passwordUpdatedAt && { 'x-password-updated-at': passwordUpdatedAt }),
      ...headers,
    },
    credentials: 'include',
    signal,
  };

  if (body !== undefined) {
    config.body = isFormData ? (body as any) : JSON.stringify(body);
  }

  const url = path.startsWith('http://') || path.startsWith('https://') ? path : `${BASE_URL}${path}`;
  return fetch(url, config);
}

export function buildQueryString(params: Record<string, string | number | undefined | null>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export { BASE_URL };
