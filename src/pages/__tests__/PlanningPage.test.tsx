import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlanningPage } from '../PlanningPage';
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
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PlanningPage />
    </QueryClientProvider>,
  );
}

function formatHeureAttendu(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

describe('PlanningPage', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.listEquipes).mockReset();
    vi.mocked(planningApi.getTourCourant).mockReset();
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
  });

  it('affiche un message de chargement pendant la récupération du tour courant', () => {
    vi.mocked(planningApi.getTourCourant).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it("affiche un message d'erreur si la récupération du tour courant échoue", async () => {
    vi.mocked(planningApi.getTourCourant).mockRejectedValue(new Error('Aucun tour en cours'));

    renderPage();

    expect(await screen.findByText('Aucun tour en cours')).toBeInTheDocument();
  });

  it('affiche le numéro et le statut du tour courant', async () => {
    vi.mocked(planningApi.getTourCourant).mockResolvedValue(
      buildTourCourant({ tour: buildTour({ numero: 3, statut: 'planifie' }) }),
    );

    renderPage();

    expect(await screen.findByText('Tour n°3 — Planifié')).toBeInTheDocument();
  });

  it("affiche \"Aucun match planifié pour ce tour.\" quand le tour n'a pas de match", async () => {
    vi.mocked(planningApi.getTourCourant).mockResolvedValue(buildTourCourant({ matches: [] }));

    renderPage();

    expect(await screen.findByText('Aucun match planifié pour ce tour.')).toBeInTheDocument();
    expect(
      screen.queryByText(/Les terrains et horaires précis seront affichés/),
    ).not.toBeInTheDocument();
  });

  it('résout les noms d\'équipes, affiche "Becot" pour un bye et les libellés de statut', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([
      buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
      buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
      buildEquipe({ id: 'equipe-3', nom: 'Finance' }),
    ]);
    vi.mocked(planningApi.getTourCourant).mockResolvedValue(
      buildTourCourant({
        matches: [
          buildMatch({
            id: 'match-1',
            equipeAId: 'equipe-1',
            equipeBId: 'equipe-2',
            terrain: 'A',
            statut: 'termine',
          }),
          buildMatch({
            id: 'match-2',
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

    const table = await screen.findByRole('table');
    expect(within(table).getByText('DSI')).toBeInTheDocument();
    expect(within(table).getByText('Marketing')).toBeInTheDocument();
    expect(within(table).getByText('Finance')).toBeInTheDocument();
    expect(within(table).getByText('Becot')).toBeInTheDocument();
    expect(within(table).getByText('Terminé')).toBeInTheDocument();
    expect(within(table).getByText('À jouer')).toBeInTheDocument();
  });

  it('affiche "À déterminer" pour le terrain et l\'horaire quand ils sont null, et le bandeau d\'information', async () => {
    vi.mocked(planningApi.getTourCourant).mockResolvedValue(
      buildTourCourant({
        matches: [buildMatch({ id: 'match-1', terrain: null, heureDebutPrevue: null, heureFinPrevue: null })],
      }),
    );

    renderPage();

    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row');
    const cells = within(rows[1]).getAllByRole('cell');

    expect(cells[0]).toHaveTextContent('À déterminer'); // terrain
    expect(cells[1]).toHaveTextContent('À déterminer'); // horaire

    expect(
      await screen.findByText(/Les terrains et horaires précis seront affichés/),
    ).toBeInTheDocument();
  });

  it("affiche le terrain et l'horaire formatés quand ils sont renseignés, et masque le bandeau d'information", async () => {
    const heureDebut = '2026-06-13T10:00:00.000Z';
    const heureFin = '2026-06-13T10:15:00.000Z';

    vi.mocked(planningApi.getTourCourant).mockResolvedValue(
      buildTourCourant({
        matches: [
          buildMatch({
            id: 'match-1',
            terrain: 'A',
            heureDebutPrevue: heureDebut,
            heureFinPrevue: heureFin,
          }),
        ],
      }),
    );

    renderPage();

    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row');
    const cells = within(rows[1]).getAllByRole('cell');

    expect(cells[0]).toHaveTextContent('A');
    expect(cells[1]).toHaveTextContent(
      `${formatHeureAttendu(heureDebut)} – ${formatHeureAttendu(heureFin)}`,
    );

    expect(
      screen.queryByText(/Les terrains et horaires précis seront affichés/),
    ).not.toBeInTheDocument();
  });

  it('trie les matchs par terrain (alphabétique, null en dernier) puis par heure de début (null en dernier)', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([
      buildEquipe({ id: 'equipe-alpha', nom: 'Alpha' }),
      buildEquipe({ id: 'equipe-beta', nom: 'Beta' }),
      buildEquipe({ id: 'equipe-gamma', nom: 'Gamma' }),
      buildEquipe({ id: 'equipe-delta', nom: 'Delta' }),
    ]);
    vi.mocked(planningApi.getTourCourant).mockResolvedValue(
      buildTourCourant({
        matches: [
          buildMatch({
            id: 'match-beta',
            equipeAId: 'equipe-beta',
            terrain: 'A',
            heureDebutPrevue: '2026-06-13T10:00:00.000Z',
          }),
          buildMatch({
            id: 'match-gamma',
            equipeAId: 'equipe-gamma',
            terrain: 'B',
            heureDebutPrevue: null,
          }),
          buildMatch({
            id: 'match-alpha',
            equipeAId: 'equipe-alpha',
            terrain: 'A',
            heureDebutPrevue: '2026-06-13T09:00:00.000Z',
          }),
          buildMatch({
            id: 'match-delta',
            equipeAId: 'equipe-delta',
            terrain: null,
            heureDebutPrevue: '2026-06-13T08:00:00.000Z',
          }),
        ],
      }),
    );

    renderPage();

    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row');
    const equipesAOrdre = rows.slice(1).map((row) => within(row).getAllByRole('cell')[2].textContent);

    expect(equipesAOrdre).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta']);
  });
});
