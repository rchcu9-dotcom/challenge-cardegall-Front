import { describe, it, expect, vi, afterEach } from 'vitest';
import { authFetch } from '../authFetch';
import { clearToken, setToken } from '../../auth/authToken';

function jsonResponse() {
  return { ok: true, status: 200, json: () => Promise.resolve({}) } as Response;
}

describe('api/authFetch', () => {
  afterEach(() => {
    clearToken();
    vi.unstubAllGlobals();
  });

  it("n'ajoute pas d'en-tête Authorization quand aucun token n'est stocké", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse());
    vi.stubGlobal('fetch', fetchMock);

    await authFetch('http://localhost:3010/users', { method: 'GET' });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/users', { method: 'GET' });
  });

  it('ajoute le Bearer token quand un token est stocké', async () => {
    setToken('jwt-abc');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse());
    vi.stubGlobal('fetch', fetchMock);

    await authFetch('http://localhost:3010/users/1/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{"role":"admin"}',
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/users/1/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-abc' },
      body: '{"role":"admin"}',
    });
  });
});
