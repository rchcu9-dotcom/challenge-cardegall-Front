import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVisibleTabs } from '../useVisibleTabs';
import { useAuth } from '../../auth/AuthContext';
import { useEnrolementEtat } from '../useEnrolementEtat';

vi.mock('../../auth/AuthContext');
vi.mock('../useEnrolementEtat');

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    loading: false,
    googleLoginUrl: 'http://localhost:3010/auth/google',
    devLogin: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });
}

function mockEnrolementEtat(cloture = false) {
  vi.mocked(useEnrolementEtat).mockReturnValue({ cloture });
}

describe('useVisibleTabs', () => {
  it('includes the Admin tab when the connected user has the admin role', () => {
    mockAuth({
      user: {
        id: 'user-1',
        providerId: 'admin@example.com',
        provider: 'dev',
        displayName: 'Admin',
        role: 'admin',
      },
    });
    mockEnrolementEtat(false);

    const { result } = renderHook(() => useVisibleTabs());

    const admin = result.current.find((tab) => tab.id === 'admin');
    expect(admin).toMatchObject({ id: 'admin', path: '/admin' });
  });

  it('hides the Admin tab when no user is connected', () => {
    mockAuth({ user: null, loading: false });
    mockEnrolementEtat(false);

    const { result } = renderHook(() => useVisibleTabs());

    expect(result.current.find((tab) => tab.id === 'admin')).toBeUndefined();
  });

  it('hides the Admin tab while the auth state is loading, even for an eventual admin', () => {
    mockAuth({
      user: {
        id: 'user-1',
        providerId: 'admin@example.com',
        provider: 'dev',
        displayName: 'Admin',
        role: 'admin',
      },
      loading: true,
    });
    mockEnrolementEtat(false);

    const { result } = renderHook(() => useVisibleTabs());

    expect(result.current.find((tab) => tab.id === 'admin')).toBeUndefined();
  });

  it('hides the Admin tab when the connected user is not admin', () => {
    mockAuth({
      user: {
        id: 'user-2',
        providerId: 'capitaine@example.com',
        provider: 'dev',
        displayName: 'Capitaine',
        role: 'capitaine',
      },
      loading: false,
    });
    mockEnrolementEtat(false);

    const { result } = renderHook(() => useVisibleTabs());

    expect(result.current.find((tab) => tab.id === 'admin')).toBeUndefined();
  });

  it('hides the Inscription tab when the enrolements are clôturés', () => {
    mockAuth();
    mockEnrolementEtat(true);

    const { result } = renderHook(() => useVisibleTabs());

    expect(result.current.find((tab) => tab.id === 'inscription')).toBeUndefined();
  });

  it('shows the Inscription tab when the enrolements are not clôturés (fail-open)', () => {
    mockAuth();
    mockEnrolementEtat(false);

    const { result } = renderHook(() => useVisibleTabs());

    expect(result.current.find((tab) => tab.id === 'inscription')).toBeDefined();
  });

  it('preserves the tabsConfig order', () => {
    mockAuth();
    mockEnrolementEtat(false);

    const { result } = renderHook(() => useVisibleTabs());

    expect(result.current.map((tab) => tab.id)).toEqual([
      'accueil',
      'competition',
      'planning',
      'resultats',
      'inscription',
    ]);
  });
});
