import { getToken } from '../auth/authToken';

export function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) return fetch(url, init);

  const headers = { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` };
  return fetch(url, { ...init, headers });
}
