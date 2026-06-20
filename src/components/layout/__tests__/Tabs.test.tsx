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
    mockEnrolementEtat(false);
  });

  it('renders a link for each section and marks the current route as active', () => {
    render(
      <MemoryRouter initialEntries={['/planning']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Accueil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inscription' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Planning' })).toHaveClass('is-active');
  });

  it('uses short labels for the bottom variant', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Tabs variant="bottom" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Résultats' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Accueil' })).toHaveClass('is-active');
  });

  it('points the Admin tab to the /admin hub when the user is admin', () => {
    mockAuth({
      user: {
        id: 'user-1',
        providerId: 'admin@example.com',
        provider: 'dev',
        displayName: 'Admin',
        role: 'admin',
      },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
  });

  it('marks the Admin tab as active on /admin/equipes', () => {
    mockAuth({
      user: {
        id: 'user-1',
        providerId: 'admin@example.com',
        provider: 'dev',
        displayName: 'Admin',
        role: 'admin',
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin/equipes']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Admin' })).toHaveClass('is-active');
  });

  it('marks the Admin tab as active on /admin/enrolement', () => {
    mockAuth({
      user: {
        id: 'user-1',
        providerId: 'admin@example.com',
        provider: 'dev',
        displayName: 'Admin',
        role: 'admin',
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin/enrolement']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Admin' })).toHaveClass('is-active');
  });

  it('hides the Admin tab when the user is not connected', () => {
    mockAuth({ user: null, loading: false });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
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

    render(
      <MemoryRouter initialEntries={['/']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
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

    render(
      <MemoryRouter initialEntries={['/']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('hides the Inscription tab when the enrolements are clôturés', () => {
    mockEnrolementEtat(true);

    render(
      <MemoryRouter initialEntries={['/']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Inscription' })).not.toBeInTheDocument();
  });

  it('shows the Inscription tab when the enrolements are not clôturés (fail-open)', () => {
    mockEnrolementEtat(false);

    render(
      <MemoryRouter initialEntries={['/']}>
        <Tabs variant="top" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Inscription' })).toBeInTheDocument();
  });
});
