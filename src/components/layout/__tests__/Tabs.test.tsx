import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Tabs } from '../Tabs';
import { useAuth } from '../../../auth/AuthContext';
import { useEnrolementEtat } from '../../../hooks/useEnrolementEtat';

vi.mock('../../../auth/AuthContext');
vi.mock('../../../hooks/useEnrolementEtat');

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

describe('Tabs', () => {
  beforeEach(() => {
    mockAuth();
  });

  it('before clôture: renders Accueil, Compétition, Inscription and marks the active route', () => {
    mockEnrolementEtat(false);

    render(
      <MemoryRouter initialEntries={['/competition']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Accueil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inscription' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Compétition' })).toHaveClass('is-active');
    expect(screen.queryByRole('link', { name: 'Planning' })).not.toBeInTheDocument();
  });

  it('after clôture: renders Accueil, Planning, Résultats & classement and marks the active route', () => {
    mockEnrolementEtat(true);

    render(
      <MemoryRouter initialEntries={['/planning']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Accueil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Résultats & classement' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Planning' })).toHaveClass('is-active');
    expect(screen.queryByRole('link', { name: 'Inscription' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Compétition' })).not.toBeInTheDocument();
  });

  it('uses short labels for the bottom variant', () => {
    mockEnrolementEtat(false);

    render(
      <MemoryRouter initialEntries={['/']}>
        <Tabs variant="bottom" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Compét.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Accueil' })).toHaveClass('is-active');
  });

  it('never renders the Admin tab, even for an admin user (Admin is never a primary tab)', () => {
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

    render(
      <MemoryRouter initialEntries={['/']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });
});
