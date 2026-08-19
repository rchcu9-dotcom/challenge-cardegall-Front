import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from '../LoginPage';
import { useAuth } from '../../auth/AuthContext';

vi.mock('../../auth/AuthContext');

function mockUseAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
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

describe('LoginPage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('affiche le bloc de connexion locale/développement hors production', () => {
    mockUseAuth();

    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Connexion locale (développement)' })).toBeInTheDocument();
  });

  it("masque le bloc de connexion locale/développement en production", () => {
    mockUseAuth();
    vi.stubEnv('PROD', true);

    render(<LoginPage />);

    expect(
      screen.queryByRole('heading', { name: 'Connexion locale (développement)' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Se connecter avec Google")).toBeInTheDocument();
  });
});
