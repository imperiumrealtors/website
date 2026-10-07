export type FieldErrors = Record<string, string>;
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; details: FieldErrors | null };

async function request<T>(method: string, url: string, body?: unknown, isForm = false): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: isForm ? undefined : body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: isForm ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });

    if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
      window.location.assign(`/admin/login?next=${encodeURIComponent(window.location.pathname)}&reason=expired`);
      return { ok: false, status: 401, error: 'Your session has expired. Please sign in again.', details: null };
    }

    const json = await res.json().catch(() => null);
    if (json && typeof json === 'object' && 'ok' in json) {
      if (json.ok) return { ok: true, data: json.data as T };
      return { ok: false, status: res.status, error: json.error ?? 'Request failed.', details: json.details ?? null };
    }
    return { ok: false, status: res.status, error: `Unexpected response (${res.status}).`, details: null };
  } catch {
    return { ok: false, status: 0, error: 'Could not reach the server. Check your connection and try again.', details: null };
  }
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body: unknown) => request<T>('PATCH', url, body),
  del: <T>(url: string) => request<T>('DELETE', url),
  upload: <T>(url: string, form: FormData) => request<T>('POST', url, form, true),
};

export { formatDate, formatBytes } from './format';
