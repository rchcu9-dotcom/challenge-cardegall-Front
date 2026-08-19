import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from '../HomePage';
import * as equipeApi from '../../api/equipe';
import * as planningApi from '../../api/planning';
import type { EquipeDto } from '../../api/equipe';
import type { MatchDto, TourCourantDto, TourDto } from '../../api/planning';

vi.mock('../../api/equipe');
vi.mock('../../api/planning');

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

function buildTour(overrides: Partial<TourDto> = {}): TourDto {
  return {
    id: 'tour-1',
    numero: 1,
    statut: 'en_cours',
    parametres: {
      nomsTerrains: ['A', 'B'],
      dureeMatchMinutes: 15,
      latenceMinutes: 5,
      delaiDemarrageMinutes: 3,
    },
    equipesBecot: [],
    ...overrides,
  };
}

function buildMatch(overrides: Partial<MatchDto> = {}): MatchDto {
  return {
    id: 'match-1',
    tourId: 'tour-1',
    equipeAId: 'equipe-1',
    equipeBId: 'equipe-2',
    estBye: false,
    terrain: null,
    heureDebutPrevue: null,
    heureFinPrevue: null,
    scoreA: null,
    scoreB: null,
    statut: 'a_jouer',
    ...overrides,
  };
}

function buildTourCourant(overrides: Partial<TourCourantDto> = {}): TourCourantDto {
  return {
    tour: buildTour(),
    matches: [],
    tousLesMatchs: overrides.matches ?? [],
    classement: [],
    resultatsComplets: false,
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.listEquipes).mockReset().mockResolvedValue([]);
    vi.mocked(planningApi.getTourCourant)
      .mockReset()
      .mockRejectedValue(new Error('Aucun tour en cours'));
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

    const statutSection = screen.getByRole('heading', { name: 'Statut du tournoi' })
      .closest('section') as HTMLElement;
    expect(within(statutSection).getByText('Chargement…')).toBeInTheDocument();
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

  function prochainsMatchsSection(): HTMLElement {
    return screen.getByRole('heading', { name: 'Prochains matchs' }).closest('section') as HTMLElement;
  }

  it('affiche un message de chargement pendant la récupération du tour courant', () => {
    vi.mocked(planningApi.getTourCourant).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(within(prochainsMatchsSection()).getByText('Chargement…')).toBeInTheDocument();
  });

  it("affiche le message par défaut quand il n'y a pas de tour en cours", async () => {
    vi.mocked(planningApi.getTourCourant).mockRejectedValue(new Error('Aucun tour en cours'));

    renderPage();

    expect(
      await within(prochainsMatchsSection()).findByText(
        'Aucun match planifié pour le moment — revenez après le lancement du premier tour.',
      ),
    ).toBeInTheDocument();
  });

  it('affiche les matchs à venir du tour courant avec équipes, terrain et horaire, et exclut les matchs terminés', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([
      buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
      buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
      buildEquipe({ id: 'equipe-3', nom: 'Finance' }),
    ]);
    vi.mocked(planningApi.getTourCourant).mockResolvedValue(
      buildTourCourant({
        matches: [
          buildMatch({
            id: 'match-termine',
            equipeAId: 'equipe-1',
            equipeBId: 'equipe-2',
            terrain: 'A',
            statut: 'termine',
          }),
          buildMatch({
            id: 'match-a-venir',
            equipeAId: 'equipe-3',
            equipeBId: null,
            estBye: true,
            terrain: 'B',
            statut: 'a_jouer',
          }),
        ],
      }),
    );

    renderPage();

    const section = prochainsMatchsSection();
    const item = await within(section).findByText(/Finance vs Becot/);
    expect(item).toBeInTheDocument();
    expect(item.textContent).toContain('B');
    expect(within(section).queryByText(/DSI vs Marketing/)).not.toBeInTheDocument();
  });
});
