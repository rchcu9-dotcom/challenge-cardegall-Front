import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopBar } from '../TopBar';
import { AuthProvider } from '../../../auth/AuthContext';
import { useEnrolementEtat } from '../../../hooks/useEnrolementEtat';

vi.mock('../../../hooks/useEnrolementEtat');

function renderTopBar() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <TopBar />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TopBar', () => {
  beforeEach(() => {
    vi.mocked(useEnrolementEtat).mockReturnValue({ cloture: false });
  });

  it('renders the app brand', () => {
    renderTopBar();

    expect(screen.getByText('Challenge CardeGall')).toBeInTheDocument();
  });

  it('toggles the hamburger menu on click', () => {
    renderTopBar();

    const toggle = screen.getByRole('button', { name: 'Ouvrir le menu' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the menu after selecting an item', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Planning' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  // Bug : le hamburger simple (mobile) ne doit pas servir d'accès au surplus en desktop —
  // un bouton "Plus" dédié, à droite des onglets, doit apparaître à la place quand il y a
  // plus de MAX_TOP_TABS onglets visibles (cf. tabsConfig : 6 onglets pour un visiteur anonyme).
  it('shows a dedicated "Plus" button when there are more than 3 visible tabs', () => {
    renderTopBar();

    expect(screen.getByRole('button', { name: "Plus d'options de navigation" })).toBeInTheDocument();
  });

  it('toggles a navigation menu from the "Plus" button', () => {
    renderTopBar();

    const more = screen.getByRole('button', { name: "Plus d'options de navigation" });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(more);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(more);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  // Bug : le menu "Plus" répétait les onglets déjà visibles dans le bandeau au lieu de
  // n'afficher que le surplus. Avant clôture, le bandeau met en avant Accueil/Compétition/
  // Inscription : le menu "Plus" ne doit donc lister que le reste.
  it('before clôture: the "Plus" menu only lists the tabs not already shown in the top bar', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: "Plus d'options de navigation" }));

    expect(screen.queryByRole('menuitem', { name: 'Accueil' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Compétition' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Inscription' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Planning' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Résultats & classement' })).toBeInTheDocument();
  });

  // Après clôture, le bandeau bascule sur Accueil/Planning/Résultats & classement : le menu
  // "Plus" doit alors lister Compétition et Phase finale (et plus du tout Inscription, masquée).
  it('after clôture: the "Plus" menu only lists the tabs not already shown in the top bar', () => {
    vi.mocked(useEnrolementEtat).mockReturnValue({ cloture: true });
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: "Plus d'options de navigation" }));

    expect(screen.queryByRole('menuitem', { name: 'Accueil' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Planning' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Résultats & classement' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Inscription' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Compétition' })).toBeInTheDocument();
  });

  // Le bandeau lui-même doit refléter l'état de clôture (cf. spec) : ce test verrouille la
  // bascule au niveau de TopBar, en plus de la couverture dédiée de `Tabs`.
  it('after clôture: the top bar shows Accueil, Planning, Résultats & classement', () => {
    vi.mocked(useEnrolementEtat).mockReturnValue({ cloture: true });
    const { container } = renderTopBar();

    const topNav = container.querySelector('.app-tabs--top');
    expect(topNav).not.toBeNull();

    expect(screen.getByRole('link', { name: 'Accueil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Planning' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Résultats & classement' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Compétition' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Inscription' })).not.toBeInTheDocument();
  });

  // Le hamburger mobile reste le menu de navigation complet (accès à tous les onglets, y
  // compris ceux déjà visibles dans le bandeau), à la différence du bouton "Plus" desktop.
  it('the hamburger menu lists every visible tab, including the ones shown in the top bar', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));

    expect(screen.getByRole('menuitem', { name: 'Accueil' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Compétition' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Planning' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Résultats & classement' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Inscription' })).toBeInTheDocument();
  });

  it('closes the "Plus" menu after selecting an item', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: "Plus d'options de navigation" }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Résultats & classement' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opening the "Plus" menu closes the hamburger menu and vice versa', () => {
    renderTopBar();

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: "Plus d'options de navigation" }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Accueil' })).not.toBeInTheDocument();
  });
});
