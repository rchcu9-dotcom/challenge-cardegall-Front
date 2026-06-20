import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import * as equipeApi from '../api/equipe';
import { AuthProvider } from '../auth/AuthContext';

vi.mock('../api/equipe');

function renderApp(initialPath = '/') {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
  });

  it('renders the HomePage on the root route', () => {
    renderApp('/');

    expect(screen.getByRole('heading', { name: 'Challenge CardeGall', level: 1 })).toBeInTheDocument();
  });

  it('renders the CompetitionPage on /competition', () => {
    renderApp('/competition');

    expect(screen.getByRole('heading', { name: 'Compétition' })).toBeInTheDocument();
  });

  it('renders the PlanningPage on /planning', () => {
    renderApp('/planning');

    expect(screen.getByRole('heading', { name: 'Planning' })).toBeInTheDocument();
  });

  it('renders the ResultatsClassementPage on /resultats', () => {
    renderApp('/resultats');

    expect(screen.getByRole('heading', { name: 'Résultats & classement' })).toBeInTheDocument();
  });

  it('renders the InscriptionEquipePage on /inscription', () => {
    renderApp('/inscription');

    expect(screen.getByRole('heading', { name: "Inscription d'une équipe" })).toBeInTheDocument();
  });

  it('renders the navigation tabs', () => {
    renderApp('/');

    expect(screen.getAllByRole('link', { name: 'Compétition' }).length).toBeGreaterThan(0);
  });

  it('renders the AdminPage on /admin', () => {
    renderApp('/admin');

    expect(screen.getByRole('heading', { name: 'Administration' })).toBeInTheDocument();
  });

  it('renders the AdminEquipesPage on /admin/equipes', async () => {
    renderApp('/admin/equipes');

    expect(await screen.findByText('Aucune équipe inscrite pour le moment.')).toBeInTheDocument();
  });
});
