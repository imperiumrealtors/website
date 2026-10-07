export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; details: Record<string, string> | null };

export async function postPublic<T = unknown>(url: string, body: Record<string, unknown>): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (json && typeof json === 'object' && 'ok' in json) return json as ApiResult<T>;
    return { ok: false, error: 'We could not reach the server. Please try again.', details: null };
  } catch {
    return { ok: false, error: 'We could not reach the server. Please check your connection and try again.', details: null };
  }
}
