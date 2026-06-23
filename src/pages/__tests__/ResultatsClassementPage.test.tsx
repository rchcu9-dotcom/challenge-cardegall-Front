import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResultatsClassementPage } from '../ResultatsClassementPage';
import * as equipeApi from '../../api/equipe';
import * as classementApi from '../../api/classement';
import type { EquipeDto } from '../../api/equipe';
import type { MatchDto, TourCourantDto, TourDto, ClassementEntryDto } from '../../api/classement';

vi.mock('../../api/equipe');
vi.mock('../../api/classement');

const STORAGE_KEY = 'cardegall:mon-equipe';

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
      <ResultatsClassementPage />
    </QueryClientProvider>,
  );
}

function getSection(headingName: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: headingName });
  return heading.closest('section') as HTMLElement;
}

describe('ResultatsClassementPage', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.listEquipes).mockReset();
    vi.mocked(classementApi.getTourCourant).mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Mon équipe', () => {
    it("n'affiche que \"Toutes les équipes\" quand aucune équipe n'est engagée", async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'inscrite' }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing', statut: 'enrolee' }),
      ]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(buildTourCourant());

      renderPage();

      await screen.findByText('Aucune donnée de classement.');

      const select = screen.getByLabelText('Mon équipe :') as HTMLSelectElement;
      const options = within(select).getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Toutes les équipes');
      expect(select.value).toBe('');
    });

    it("affiche les équipes engagées triées par ordre d'arrivée comme options", async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'engagee', ordreArrivee: 2 }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing', statut: 'engagee', ordreArrivee: 1 }),
        buildEquipe({ id: 'equipe-3', nom: 'Finance', statut: 'retiree', ordreArrivee: 3 }),
      ]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(buildTourCourant());

      renderPage();

      await screen.findByText('Aucune donnée de classement.');

      const select = screen.getByLabelText('Mon équipe :') as HTMLSelectElement;
      const options = within(select).getAllByRole('option');
      expect(options.map((option) => option.textContent)).toEqual([
        'Toutes les équipes',
        'Marketing',
        'DSI',
      ]);
    });

    it('met à jour la sélection et la persiste dans localStorage lors du changement', async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'engagee', ordreArrivee: 1 }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing', statut: 'engagee', ordreArrivee: 2 }),
      ]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(buildTourCourant());

      renderPage();

      const select = (await screen.findByLabelText('Mon équipe :')) as HTMLSelectElement;
      await within(select).findByRole('option', { name: 'Marketing' });
      fireEvent.change(select, { target: { value: 'equipe-2' } });

      expect(select.value).toBe('equipe-2');
      expect(localStorage.getItem(STORAGE_KEY)).toBe('equipe-2');

      fireEvent.change(select, { target: { value: '' } });

      expect(select.value).toBe('');
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('initialise la sélection depuis localStorage', async () => {
      localStorage.setItem(STORAGE_KEY, 'equipe-2');

      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'engagee', ordreArrivee: 1 }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing', statut: 'engagee', ordreArrivee: 2 }),
      ]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(buildTourCourant());

      renderPage();

      const select = (await screen.findByLabelText('Mon équipe :')) as HTMLSelectElement;
      await within(select).findByRole('option', { name: 'Marketing' });
      expect(select.value).toBe('equipe-2');
    });
  });

  describe('Classement', () => {
    it('affiche un message de chargement pendant la récupération du tour courant', () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
      vi.mocked(classementApi.getTourCourant).mockReturnValue(new Promise(() => {}));

      renderPage();

      expect(within(getSection('Classement')).getByText('Chargement…')).toBeInTheDocument();
    });

    it("affiche un message d'erreur si la récupération du tour courant échoue", async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
      vi.mocked(classementApi.getTourCourant).mockRejectedValue(new Error('Aucun tour en cours'));

      renderPage();

      expect(
        await within(getSection('Classement')).findByText('Aucun tour en cours'),
      ).toBeInTheDocument();
    });

    it('affiche "Aucune donnée de classement." quand le classement est vide', async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(buildTourCourant({ classement: [] }));

      renderPage();

      expect(
        await within(getSection('Classement')).findByText('Aucune donnée de classement.'),
      ).toBeInTheDocument();
    });

    it('affiche le tableau de classement avec toutes les colonnes', async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
      ]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          classement: [
            buildClassementEntry({
              equipeId: 'equipe-1',
              rang: 1,
              points: 6,
              victoires: 2,
              nuls: 0,
              defaites: 0,
              butsMarques: 8,
              butsConcedes: 2,
              diffGenerale: 6,
            }),
            buildClassementEntry({
              equipeId: 'equipe-2',
              rang: 2,
              points: 0,
              victoires: 0,
              nuls: 0,
              defaites: 2,
              butsMarques: 2,
              butsConcedes: 8,
              diffGenerale: -6,
            }),
          ],
        }),
      );

      renderPage();

      const table = (await within(getSection('Classement')).findByRole('table')) as HTMLElement;

      const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent);
      expect(headers).toEqual([
        'Rang',
        'Équipe',
        'Pts',
        'V',
        'N',
        'D',
        'Buts marqués',
        'Buts concédés',
        'Diff.',
      ]);

      const rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3);

      const firstRowCells = within(rows[1]).getAllByRole('cell').map((td) => td.textContent);
      expect(firstRowCells).toEqual(['1', 'DSI', '6', '2', '0', '0', '8', '2', '6']);
    });

    it("met en surbrillance la ligne de l'équipe sélectionnée", async () => {
      localStorage.setItem(STORAGE_KEY, 'equipe-2');

      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'engagee', ordreArrivee: 1 }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing', statut: 'engagee', ordreArrivee: 2 }),
      ]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          classement: [
            buildClassementEntry({ equipeId: 'equipe-1', rang: 1 }),
            buildClassementEntry({ equipeId: 'equipe-2', rang: 2 }),
          ],
        }),
      );

      renderPage();

      const table = (await within(getSection('Classement')).findByRole('table')) as HTMLElement;
      const rows = within(table).getAllByRole('row');

      expect(rows[1]).not.toHaveClass('is-equipe-selectionnee');
      expect(rows[2]).toHaveClass('is-equipe-selectionnee');
    });
  });

  describe('Résultats', () => {
    it('affiche un message de chargement pendant la récupération du tour courant', () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
      vi.mocked(classementApi.getTourCourant).mockReturnValue(new Promise(() => {}));

      renderPage();

      expect(within(getSection('Résultats')).getByText('Chargement…')).toBeInTheDocument();
    });

    it("affiche un message d'erreur si la récupération du tour courant échoue", async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
      vi.mocked(classementApi.getTourCourant).mockRejectedValue(new Error('Aucun tour en cours'));

      renderPage();

      expect(
        await within(getSection('Résultats')).findByText('Aucun tour en cours'),
      ).toBeInTheDocument();
    });

    it('affiche "Aucun résultat disponible pour le moment." quand aucun match n\'est terminé', async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [buildMatch({ id: 'match-1', statut: 'a_jouer' })],
        }),
      );

      renderPage();

      expect(
        await within(getSection('Résultats')).findByText('Aucun résultat disponible pour le moment.'),
      ).toBeInTheDocument();
    });

    it('affiche "Aucun résultat pour cette équipe pour le moment." quand des résultats existent mais aucun pour l\'équipe sélectionnée', async () => {
      localStorage.setItem(STORAGE_KEY, 'equipe-3');

      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'engagee', ordreArrivee: 1 }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing', statut: 'engagee', ordreArrivee: 2 }),
        buildEquipe({ id: 'equipe-3', nom: 'Finance', statut: 'engagee', ordreArrivee: 3 }),
      ]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [
            buildMatch({
              id: 'match-1',
              equipeAId: 'equipe-1',
              equipeBId: 'equipe-2',
              scoreA: 2,
              scoreB: 1,
              statut: 'termine',
            }),
          ],
        }),
      );

      renderPage();

      expect(
        await within(getSection('Résultats')).findByText(
          'Aucun résultat pour cette équipe pour le moment.',
        ),
      ).toBeInTheDocument();
    });

    it('affiche le tableau des résultats avec "Becot" pour un bye et le score formaté', async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
        buildEquipe({ id: 'equipe-3', nom: 'Finance' }),
      ]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
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
              scoreA: null,
              scoreB: null,
              statut: 'termine',
            }),
            buildMatch({
              id: 'match-3',
              equipeAId: 'equipe-1',
              equipeBId: 'equipe-3',
              statut: 'a_jouer',
            }),
          ],
        }),
      );

      renderPage();

      const table = (await within(getSection('Résultats')).findByRole('table')) as HTMLElement;
      const rows = within(table).getAllByRole('row');

      // 1 ligne d'en-tête + 2 matchs terminés (le match "à jouer" est exclu)
      expect(rows).toHaveLength(3);

      const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent);
      expect(headers).toEqual(['Équipe A', 'Équipe B', 'Score']);

      const firstRowCells = within(rows[1]).getAllByRole('cell').map((td) => td.textContent);
      expect(firstRowCells).toEqual(['DSI', 'Marketing', '3 - 1']);

      const secondRowCells = within(rows[2]).getAllByRole('cell').map((td) => td.textContent);
      expect(secondRowCells).toEqual(['Finance', 'Becot', '—']);
    });

    it('affiche les résultats des tours précédents, pas seulement ceux du tour en cours', async () => {
      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
        buildEquipe({ id: 'equipe-3', nom: 'Finance' }),
      ]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          // Tour courant (tour-2) : un seul match, pas encore joué.
          matches: [buildMatch({ id: 'match-2', tourId: 'tour-2', statut: 'a_jouer' })],
          // Tous les matchs du tournoi : inclut un match terminé du tour précédent (tour-1).
          tousLesMatchs: [
            buildMatch({
              id: 'match-1',
              tourId: 'tour-1',
              equipeAId: 'equipe-1',
              equipeBId: 'equipe-3',
              scoreA: 4,
              scoreB: 0,
              statut: 'termine',
            }),
            buildMatch({ id: 'match-2', tourId: 'tour-2', statut: 'a_jouer' }),
          ],
        }),
      );

      renderPage();

      const table = (await within(getSection('Résultats')).findByRole('table')) as HTMLElement;
      const rows = within(table).getAllByRole('row');

      // 1 ligne d'en-tête + le match terminé du tour précédent.
      expect(rows).toHaveLength(2);
      const cells = within(rows[1]).getAllByRole('cell').map((td) => td.textContent);
      expect(cells).toEqual(['DSI', 'Finance', '4 - 0']);
    });

    it("filtre les résultats sur l'équipe sélectionnée", async () => {
      localStorage.setItem(STORAGE_KEY, 'equipe-2');

      vi.mocked(equipeApi.listEquipes).mockResolvedValue([
        buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'engagee', ordreArrivee: 1 }),
        buildEquipe({ id: 'equipe-2', nom: 'Marketing', statut: 'engagee', ordreArrivee: 2 }),
        buildEquipe({ id: 'equipe-3', nom: 'Finance', statut: 'engagee', ordreArrivee: 3 }),
      ]);
      vi.mocked(classementApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [
            buildMatch({
              id: 'match-1',
              equipeAId: 'equipe-1',
              equipeBId: 'equipe-2',
              scoreA: 2,
              scoreB: 2,
              statut: 'termine',
            }),
            buildMatch({
              id: 'match-2',
              equipeAId: 'equipe-1',
              equipeBId: 'equipe-3',
              scoreA: 1,
              scoreB: 0,
              statut: 'termine',
            }),
          ],
        }),
      );

      renderPage();

      const table = (await within(getSection('Résultats')).findByRole('table')) as HTMLElement;
      const rows = within(table).getAllByRole('row');

      // 1 ligne d'en-tête + 1 match impliquant equipe-2
      expect(rows).toHaveLength(2);
      expect(within(rows[1]).getByText('Marketing')).toBeInTheDocument();
      expect(within(table).queryByText('Finance')).not.toBeInTheDocument();
    });
  });
});
