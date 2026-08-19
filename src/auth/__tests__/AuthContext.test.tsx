import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../AuthContext';
import type { AdminProfile } from '../AuthContext';
import { clearToken, getToken, setToken } from '../authToken';

function buildProfile(overrides: Partial<AdminProfile> = {}): AdminProfile {
  return {
    id: 'user-1',
    providerId: 'google-1',
    provider: 'google',
    displayName: 'Alice',
    email: 'alice@orange.com',
    role: 'admin',
    ...overrides,
  };
}

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 401) {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe('AuthContext', () => {
  afterEach(() => {
    clearToken();
    vi.unstubAllGlobals();
  });

  it("sans token stocké : user reste null, loading passe à false, aucun fetch n'est déclenché", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('avec un token stocké : /auth/me est appelé avec le Bearer, loading retombe à false et user est rempli', async () => {
    setToken('jwt-abc');
    const profile = buildProfile();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(profile));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(profile);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/auth/me', {
      headers: { Authorization: 'Bearer jwt-abc' },
    });
  });

  it('en cas de réponse non-ok (401) : le token est effacé et user reste null', async () => {
    setToken('jwt-expired');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, false, 401));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(getToken()).toBeNull();
  });

  it('devLogin stocke le token reçu puis recharge le profil (refresh)', async () => {
    const profile = buildProfile({ displayName: 'Bob' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'jwt-new' }))
      .mockResolvedValueOnce(jsonResponse(profile));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();

    await act(async () => {
      await result.current.devLogin('bob@orange.com', 'Bob');
    });
    // La notification TanStack Query au composant est batchée sur un microtask distinct de la
    // promesse de `devLogin` : on attend explicitement la propagation avant d'asserter `user`.
    await waitFor(() => expect(result.current.user).toEqual(profile));

    expect(getToken()).toBe('jwt-new');
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3010/auth/dev-login',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:3010/auth/me', {
      headers: { Authorization: 'Bearer jwt-new' },
    });
  });

  it('logout efface le token et remet user à null immédiatement (sans requête réseau supplémentaire)', async () => {
    setToken('jwt-abc');
    const profile = buildProfile();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(profile));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.user).toEqual(profile));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.logout();
    });
    await waitFor(() => expect(result.current.user).toBeNull());

    expect(getToken()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refresh() ne se résout qu'une fois le profil rechargé (pattern utilisé par AuthCallbackPage)", async () => {
    setToken('jwt-1');
    const profileV1 = buildProfile({ displayName: 'V1' });
    const profileV2 = buildProfile({ displayName: 'V2' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(profileV1))
      .mockResolvedValueOnce(jsonResponse(profileV2));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.user).toEqual(profileV1));

    await act(async () => {
      await result.current.refresh();
    });
    await waitFor(() => expect(result.current.user).toEqual(profileV2));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
