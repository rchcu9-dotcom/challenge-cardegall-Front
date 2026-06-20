import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompetitionPage } from '../CompetitionPage';
import * as equipeApi from '../../api/equipe';
import * as tourApi from '../../api/tour';
import type { EquipeDto } from '../../api/equipe';
import type { MatchDto, TourCourantDto, TourDto, ClassementEntryDto } from '../../api/tour';

vi.mock('../../api/equipe');
vi.mock('../../api/tour');

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

function buildClassementEntry(overrides: Partial<ClassementEntryDto> = {}): ClassementEntryDto {
  return {
    equipeId: 'equipe-1',
    points: 0,
    victoires: 0,
    nuls: 0,
    defaites: 0,
    butsMarques: 0,
    butsConcedes: 0,
    diffGenerale: 0,
    diffParticuliere: 0,
    nbFeminines: 3,
    rang: 1,
    ...overrides,
  };
}

function buildTourCourant(overrides: Partial<TourCourantDto> = {}): TourCourantDto {
  return {
    tour: buildTour(),
    matches: [],
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
      <CompetitionPage />
    </QueryClientProvider>,
  );
}

function getSection(headingName: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: headingName });
  return heading.closest('section') as HTMLElement;
}

describe('CompetitionPage', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.listEquipes).mockReset();
    vi.mocked(tourApi.getTourCourant).mockReset();
  });

  describe('Format du tournoi', () => {
    it('affiche les règles de la ronde suisse et de la phase finale Cardebat / Le Gall', async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(buildTourCourant());

      renderPage();

      expect(screen.getByRole('heading', { name: 'Format du tournoi' })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Phase de poules — ronde suisse' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Phase finale — Cardebat / Le Gall' }),
      ).toBeInTheDocument();

      const formatSection = getSection('Format du tournoi');
      expect(formatSection).toHaveTextContent(/becot/i);
      expect(formatSection).toHaveTextContent(/Cardebat/);
      expect(formatSection).toHaveTextContent(/Le Gall/);

      await screen.findByText('Tour n°1 — En cours');
    });
  });

  describe('Équipes engagées', () => {
    it('affiche un message de chargement pendant la récupération des équipes', async () => {
      vi.mocked(equipeApi.listEquipes).mockReturnValue(new Promise(() => {}));
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(buildTourCourant());

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      expect(within(getSection('Équipes engagées')).getByText('Chargement…')).toBeInTheDocument();
    });

    it("affiche un message d'erreur si la récupération des équipes échoue", async () => {
      vi.mocked(equipeApi.listEquipes).mockRejectedValue(new Error('Erreur équipes'));
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(buildTourCourant());

      renderPage();

      expect(
        await within(getSection('Équipes engagées')).findByText('Erreur équipes'),
      ).toBeInTheDocument();
    });

    it("affiche un message d'attente quand aucune équipe n'est encore engagée", async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'inscrite' }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing', statut: 'enrolee' }),
      ]);
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(buildTourCourant());

      renderPage();

      expect(
        await screen.findByText(
          'La liste des équipes engagées sera publiée après la clôture des enrôlements.',
        ),
      ).toBeInTheDocument();
      expect(document.querySelector('.competition-equipes-list')).toBeNull();
    });

    it("affiche la liste des équipes engagées triées par ordre d'arrivée", async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'engagee', ordreArrivee: 2 }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing', statut: 'engagee', ordreArrivee: 1 }),
        buildEquipe({ id: 'equipe-3', nom: 'Finance', statut: 'retiree', ordreArrivee: 3 }),
      ]);
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(buildTourCourant());

      renderPage();

      await screen.findByText('Marketing');

      const list = document.querySelector('.competition-equipes-list') as HTMLElement;
      expect(list).not.toBeNull();

      const items = within(list).getAllByRole('listitem');
      expect(items.map((item) => item.textContent)).toEqual(['Marketing', 'DSI']);
      expect(screen.queryByText('Finance')).not.toBeInTheDocument();
    });
  });

  describe("État d'avancement", () => {
    it('affiche un message de chargement pendant la récupération du tour courant', () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
      vi.mocked(tourApi.getTourCourant).mockReturnValue(new Promise(() => {}));

      renderPage();

      expect(
        within(getSection("État d'avancement")).getByText('Chargement…'),
      ).toBeInTheDocument();
    });

    it("affiche un message d'erreur si la récupération du tour courant échoue", async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
      vi.mocked(tourApi.getTourCourant).mockRejectedValue(new Error('Aucun tour en cours'));

      renderPage();

      expect(
        await within(getSection("État d'avancement")).findByText('Aucun tour en cours'),
      ).toBeInTheDocument();
    });

    it('affiche le numéro et le statut du tour courant, ses matchs avec noms d\'équipes, "Becot" pour un bye et le score ou un tiret', async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
        buildEquipe({ id: 'equipe-3', nom: 'Finance' }),
      ]);
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          tour: buildTour({ numero: 2, statut: 'en_cours' }),
          matches: [
            buildMatch({
              id: 'match-1',
              equipeAId: 'equipe-1',
              equipeBId: 'equipe-2',
              scoreA: 3,
              scoreB: 1,
              statut: 'termine',
            }),
            buildMatch({
              id: 'match-2',
              equipeAId: 'equipe-3',
              equipeBId: null,
              estBye: true,
              statut: 'a_jouer',
            }),
          ],
        }),
      );

      renderPage();

      expect(await screen.findByText('Tour n°2 — En cours')).toBeInTheDocument();

      const matchesTable = document.querySelector('.tour-matches-table') as HTMLElement;
      expect(matchesTable).not.toBeNull();
      expect(within(matchesTable).getByText('DSI')).toBeInTheDocument();
      expect(within(matchesTable).getByText('Marketing')).toBeInTheDocument();
      expect(within(matchesTable).getByText('3 - 1')).toBeInTheDocument();
      expect(within(matchesTable).getByText('Terminé')).toBeInTheDocument();
      expect(within(matchesTable).getByText('Finance')).toBeInTheDocument();
      expect(within(matchesTable).getByText('Becot')).toBeInTheDocument();
      expect(within(matchesTable).getByText('—')).toBeInTheDocument();
      expect(within(matchesTable).getByText('À jouer')).toBeInTheDocument();
    });

    it('affiche "Aucun match pour ce tour." quand le tour n\'a pas de match', async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(buildTourCourant({ matches: [] }));

      renderPage();

      expect(await screen.findByText('Aucun match pour ce tour.')).toBeInTheDocument();
    });

    it('affiche le tableau de classement avec rang, équipe et statistiques', async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
      ]);
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          classement: [
            buildClassementEntry({ equipeId: 'equipe-1', rang: 1, points: 3, victoires: 1 }),
            buildClassementEntry({ equipeId: 'equipe-2', rang: 2, points: 0, defaites: 1 }),
          ],
        }),
      );

      renderPage();

      const classementTable = await screen.findByText('Tour n°1 — En cours').then(() =>
        document.querySelector('.tour-classement-table') as HTMLElement,
      );
      expect(classementTable).not.toBeNull();
      expect(within(classementTable).getByText('DSI')).toBeInTheDocument();
      expect(within(classementTable).getByText('Marketing')).toBeInTheDocument();

      const rows = within(classementTable).getAllByRole('row');
      // 1 ligne d'en-tête + 2 lignes de classement
      expect(rows).toHaveLength(3);
    });

    it('affiche "Aucune donnée de classement." quand le classement est vide', async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(buildTourCourant({ classement: [] }));

      renderPage();

      expect(await screen.findByText('Aucune donnée de classement.')).toBeInTheDocument();
    });
  });
});
