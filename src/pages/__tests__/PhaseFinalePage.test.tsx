import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PhaseFinalePage } from '../PhaseFinalePage';
import * as equipeApi from '../../api/equipe';
import * as finaleApi from '../../api/finale';
import type { EquipeDto } from '../../api/equipe';
import type { MatchFinaleDto, PhaseFinaleDto } from '../../api/finale';

vi.mock('../../api/equipe');
vi.mock('../../api/finale');

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

function buildMatchFinale(overrides: Partial<MatchFinaleDto> = {}): MatchFinaleDto {
  return {
    id: 'match-1',
    type: 'demi_finale_a',
    equipeAId: 'equipe-1',
    equipeBId: 'equipe-4',
    scoreA: null,
    scoreB: null,
    statut: 'a_jouer',
    ...overrides,
  };
}

function buildPhaseFinale(overrides: Partial<PhaseFinaleDto> = {}): PhaseFinaleDto {
  return {
    demarree: false,
    statut: null,
    demiFinaleA: null,
    demiFinaleB: null,
    finaleCardebat: null,
    finaleLeGall: null,
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PhaseFinalePage />
    </QueryClientProvider>,
  );
}

describe('PhaseFinalePage', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.listEquipes).mockReset();
    vi.mocked(finaleApi.getPhaseFinaleCourante).mockReset();

    vi.mocked(equipeApi.listEquipes).mockResolvedValue([
      buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
      buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
      buildEquipe({ id: 'equipe-3', nom: 'Finance' }),
      buildEquipe({ id: 'equipe-4', nom: 'RH' }),
    ]);
  });

  it('affiche un message de chargement pendant la récupération de la phase finale', () => {
    vi.mocked(finaleApi.getPhaseFinaleCourante).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it('affiche un message d\'erreur si la récupération échoue', async () => {
    vi.mocked(finaleApi.getPhaseFinaleCourante).mockRejectedValue(new Error('Erreur réseau'));

    renderPage();

    expect(await screen.findByText('Erreur réseau')).toBeInTheDocument();
  });

  it("affiche un message si la phase finale n'a pas encore commencé", async () => {
    vi.mocked(finaleApi.getPhaseFinaleCourante).mockResolvedValue(buildPhaseFinale({ demarree: false }));

    renderPage();

    expect(
      await screen.findByText("La phase finale n'a pas encore commencé."),
    ).toBeInTheDocument();
  });

  it('affiche les brackets avec les noms des équipes et "À déterminer" pour les finales non encore connues', async () => {
    vi.mocked(finaleApi.getPhaseFinaleCourante).mockResolvedValue(
      buildPhaseFinale({
        demarree: true,
        statut: 'en_cours',
        demiFinaleA: buildMatchFinale({
          id: 'demi-a',
          type: 'demi_finale_a',
          equipeAId: 'equipe-1',
          equipeBId: 'equipe-4',
        }),
        demiFinaleB: buildMatchFinale({
          id: 'demi-b',
          type: 'demi_finale_b',
          equipeAId: 'equipe-2',
          equipeBId: 'equipe-3',
        }),
        finaleCardebat: null,
        finaleLeGall: null,
      }),
    );

    renderPage();

    expect(await screen.findByText('Demi-finale 1 (1er vs 4e)')).toBeInTheDocument();
    expect(screen.getByText('Demi-finale 2 (2e vs 3e)')).toBeInTheDocument();
    expect(screen.getByText('DSI vs RH')).toBeInTheDocument();
    expect(screen.getByText('Marketing vs Finance')).toBeInTheDocument();

    // Les finales ne sont pas affichées tant que finaleCardebat/finaleLeGall sont null
    expect(screen.queryByText('Finale Cardebat')).not.toBeInTheDocument();
    expect(screen.queryByText('Finale Le Gall (petite finale)')).not.toBeInTheDocument();
  });

  it('affiche le score quand il est connu, sinon un tiret', async () => {
    vi.mocked(finaleApi.getPhaseFinaleCourante).mockResolvedValue(
      buildPhaseFinale({
        demarree: true,
        statut: 'en_cours',
        demiFinaleA: buildMatchFinale({
          id: 'demi-a',
          type: 'demi_finale_a',
          equipeAId: 'equipe-1',
          equipeBId: 'equipe-4',
          scoreA: 3,
          scoreB: 1,
          statut: 'termine',
        }),
        demiFinaleB: buildMatchFinale({
          id: 'demi-b',
          type: 'demi_finale_b',
          equipeAId: 'equipe-2',
          equipeBId: 'equipe-3',
          scoreA: null,
          scoreB: null,
          statut: 'a_jouer',
        }),
      }),
    );

    renderPage();

    await screen.findByText('Demi-finale 1 (1er vs 4e)');
    expect(screen.getByText('3 - 1')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('affiche les finales (Cardebat et Le Gall) avec leurs équipes une fois connues', async () => {
    vi.mocked(finaleApi.getPhaseFinaleCourante).mockResolvedValue(
      buildPhaseFinale({
        demarree: true,
        statut: 'terminee',
        demiFinaleA: buildMatchFinale({
          id: 'demi-a',
          type: 'demi_finale_a',
          equipeAId: 'equipe-1',
          equipeBId: 'equipe-4',
          scoreA: 3,
          scoreB: 1,
          statut: 'termine',
        }),
        demiFinaleB: buildMatchFinale({
          id: 'demi-b',
          type: 'demi_finale_b',
          equipeAId: 'equipe-2',
          equipeBId: 'equipe-3',
          scoreA: 0,
          scoreB: 2,
          statut: 'termine',
        }),
        finaleCardebat: buildMatchFinale({
          id: 'finale-cardebat',
          type: 'finale_cardebat',
          equipeAId: 'equipe-1',
          equipeBId: 'equipe-3',
          scoreA: 2,
          scoreB: 0,
          statut: 'termine',
        }),
        finaleLeGall: buildMatchFinale({
          id: 'finale-le-gall',
          type: 'finale_le_gall',
          equipeAId: 'equipe-4',
          equipeBId: 'equipe-2',
          scoreA: 1,
          scoreB: 1,
          statut: 'a_jouer',
        }),
      }),
    );

    renderPage();

    expect(await screen.findByText('Finale Cardebat')).toBeInTheDocument();
    expect(screen.getByText('Finale Le Gall (petite finale)')).toBeInTheDocument();
    expect(screen.getByText('DSI vs Finance')).toBeInTheDocument();
    expect(screen.getByText('RH vs Marketing')).toBeInTheDocument();
    expect(screen.getByText('2 - 0')).toBeInTheDocument();
  });
});
