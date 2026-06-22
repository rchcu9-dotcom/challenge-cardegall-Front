import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutRoot } from '../LayoutRoot';
import { AuthProvider } from '../../../auth/AuthContext';
import { useEnrolementEtat } from '../../../hooks/useEnrolementEtat';

vi.mock('../../../hooks/useEnrolementEtat');

function renderLayoutRoot(initialPath = '/') {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <LayoutRoot>
            <p>Contenu de la page</p>
          </LayoutRoot>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LayoutRoot', () => {
  beforeEach(() => {
    vi.mocked(useEnrolementEtat).mockReturnValue({ cloture: false });
  });

  it('renders the top bar, the page content and the bottom navigation', () => {
    renderLayoutRoot();

    expect(screen.getByText('Challenge CardeGall')).toBeInTheDocument();
    expect(screen.getByText('Contenu de la page')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Accueil' }).length).toBeGreaterThan(0);
  });

  // Bug : le bandeau bas (mobile) n'était pas limité à 3 entrées comme le bandeau haut (desktop).
  it('before clôture: limits the bottom navigation to Accueil, Compét., Inscription', () => {
    const { container } = renderLayoutRoot();

    const bottomNav = container.querySelector('.app-tabs--bottom');
    expect(bottomNav).not.toBeNull();

    expect(within(bottomNav as HTMLElement).getByRole('link', { name: 'Accueil' })).toBeInTheDocument();
    expect(within(bottomNav as HTMLElement).getByRole('link', { name: 'Compét.' })).toBeInTheDocument();
    expect(within(bottomNav as HTMLElement).getByRole('link', { name: 'Inscription' })).toBeInTheDocument();
    expect(
      within(bottomNav as HTMLElement).queryByRole('link', { name: 'Planning' }),
    ).not.toBeInTheDocument();
    expect(
      within(bottomNav as HTMLElement).queryByRole('link', { name: 'Résultats' }),
    ).not.toBeInTheDocument();
    expect(within(bottomNav as HTMLElement).queryByRole('link', { name: 'Finale' })).not.toBeInTheDocument();
  });

  // Une fois les enrôlements clôturés, le bandeau bas bascule sur Accueil/Planning/Résultats,
  // et Inscription disparaît entièrement (comportement déjà existant, non régressé).
  it('after clôture: limits the bottom navigation to Accueil, Planning, Résultats', () => {
    vi.mocked(useEnrolementEtat).mockReturnValue({ cloture: true });
    const { container } = renderLayoutRoot();

    const bottomNav = container.querySelector('.app-tabs--bottom');
    expect(bottomNav).not.toBeNull();

    expect(within(bottomNav as HTMLElement).getByRole('link', { name: 'Accueil' })).toBeInTheDocument();
    expect(within(bottomNav as HTMLElement).getByRole('link', { name: 'Planning' })).toBeInTheDocument();
    expect(within(bottomNav as HTMLElement).getByRole('link', { name: 'Résultats' })).toBeInTheDocument();
    expect(
      within(bottomNav as HTMLElement).queryByRole('link', { name: 'Compét.' }),
    ).not.toBeInTheDocument();
    expect(within(bottomNav as HTMLElement).queryByRole('link', { name: 'Finale' })).not.toBeInTheDocument();
    expect(
      within(bottomNav as HTMLElement).queryByRole('link', { name: 'Inscription' }),
    ).not.toBeInTheDocument();
  });

  it('does not show a breadcrumb on the Accueil page', () => {
    renderLayoutRoot('/');

    expect(screen.queryByRole('navigation', { name: "Fil d'Ariane" })).not.toBeInTheDocument();
  });

  it('shows a breadcrumb on a top-level page', () => {
    renderLayoutRoot('/planning');

    const nav = screen.getByRole('navigation', { name: "Fil d'Ariane" });

    const accueilLink = within(nav).getByRole('link', { name: 'Accueil' });
    expect(accueilLink).toHaveAttribute('href', '/');

    expect(within(nav).getByText('Planning')).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Planning' })).not.toBeInTheDocument();
  });

  it('shows a full breadcrumb trail on an Admin sub-page', () => {
    renderLayoutRoot('/admin/equipes');

    const nav = screen.getByRole('navigation', { name: "Fil d'Ariane" });

    const accueilLink = within(nav).getByRole('link', { name: 'Accueil' });
    expect(accueilLink).toHaveAttribute('href', '/');

    const adminLink = within(nav).getByRole('link', { name: 'Admin' });
    expect(adminLink).toHaveAttribute('href', '/admin');

    expect(within(nav).getByText('Équipes inscrites')).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Équipes inscrites' })).not.toBeInTheDocument();
  });
});
