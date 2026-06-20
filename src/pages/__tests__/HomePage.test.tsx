import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from '../HomePage';
import * as equipeApi from '../../api/equipe';
import type { EquipeDto } from '../../api/equipe';

vi.mock('../../api/equipe');

function buildEquipe(overrides: Partial<EquipeDto> = {}): EquipeDto {
  return {
    id: 'equipe-1',
    nom: 'DSI',
    capitaineUserId: 'demo-dsi',
    nbJoueursApprox: 10,
    nbFemininesEnvisage: 3,
    statut: 'inscrite',
    dateInscription: '2026-06-13T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.listEquipes).mockReset().mockResolvedValue([]);
  });

  it('renders the tournament title', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Challenge CardeGall' })).toBeInTheDocument();
  });

  it('renders an introductory message', () => {
    renderPage();

    expect(screen.getByText(/Tournoi inter-services Orange Business/i)).toBeInTheDocument();
  });

  it('expose une ancre #statut-tournoi sur la section Statut du tournoi', () => {
    renderPage();

    const statutSection = screen.getByRole('heading', { name: 'Statut du tournoi' }).closest('section');
    expect(statutSection).toHaveAttribute('id', 'statut-tournoi');
  });

  it('affiche un message de chargement pendant la récupération des équipes', () => {
    vi.mocked(equipeApi.listEquipes).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it('affiche la liste des équipes déjà inscrites triées par date d’inscription croissante', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([
      buildEquipe({ id: 'equipe-2', nom: 'Marketing', dateInscription: '2026-06-14T00:00:00.000Z' }),
      buildEquipe({ id: 'equipe-1', nom: 'DSI', dateInscription: '2026-06-13T00:00:00.000Z' }),
    ]);

    renderPage();

    expect(await screen.findByText('Les équipes déjà inscrites sont :')).toBeInTheDocument();

    const statutSection = screen.getByRole('heading', { name: 'Statut du tournoi' })
      .closest('section') as HTMLElement;
    const items = within(statutSection).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['DSI', 'Marketing']);
  });

  it('affiche un message quand aucune équipe n’est inscrite', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucune équipe inscrite pour le moment.')).toBeInTheDocument();
    expect(screen.queryByText('Les équipes déjà inscrites sont :')).not.toBeInTheDocument();
  });
});
