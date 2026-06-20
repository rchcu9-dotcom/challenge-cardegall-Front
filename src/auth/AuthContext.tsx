import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { clearToken, getToken, setToken } from './authToken';

declare const __APP_API_BASE_URL__: string | undefined;

const API_BASE_URL =
  typeof __APP_API_BASE_URL__ !== 'undefined' ? __APP_API_BASE_URL__ : 'http://localhost:3010';

export type RoleAdmin = 'admin' | 'capitaine' | 'membre';

export interface AdminProfile {
  id: string;
  providerId: string;
  provider: string;
  displayName: string;
  email?: string;
  role: RoleAdmin;
}

interface AuthContextValue {
  user: AdminProfile | null;
  loading: boolean;
  googleLoginUrl: string;
  devLogin: (email: string, displayName: string) => Promise<void>;
  /** Recharge le profil depuis /auth/me (ex: après stockage d'un token reçu via /auth/callback). */
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        clearToken();
        setUser(null);
        return;
      }
      setUser((await res.json()) as AdminProfile);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const devLogin = useCallback(
    async (email: string, displayName: string) => {
      const res = await fetch(`${API_BASE_URL}/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body && typeof body === 'object' && 'message' in body && String(body.message)) ||
            `Erreur ${res.status}`,
        );
      }
      const { token } = (await res.json()) as { token: string };
      setToken(token);
      await loadUser();
    },
    [loadUser],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      googleLoginUrl: `${API_BASE_URL}/auth/google`,
      devLogin,
      refresh: loadUser,
      logout,
    }),
    [user, loading, devLogin, loadUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé sous AuthProvider');
  return ctx;
}
