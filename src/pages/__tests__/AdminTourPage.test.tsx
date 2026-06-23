import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AdminTourPage } from '../AdminTourPage';
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
      <MemoryRouter>
        <AdminTourPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminTourPage', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.listEquipes).mockReset();
    vi.mocked(tourApi.getTourCourant).mockReset();
    vi.mocked(tourApi.terminerTour).mockReset();
    vi.mocked(tourApi.enregistrerScoreMatch).mockReset();
    vi.mocked(tourApi.reorganiserPlanning).mockReset();

    vi.mocked(equipeApi.listEquipes).mockResolvedValue([
      buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
      buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
    ]);
  });

  it('affiche un message de chargement pendant la récupération du tour courant', () => {
    vi.mocked(tourApi.getTourCourant).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it('affiche le numéro et le statut du tour courant, ainsi que ses matchs avec les noms des équipes', async () => {
    vi.mocked(tourApi.getTourCourant).mockResolvedValue(
      buildTourCourant({
        tour: buildTour({ numero: 1, statut: 'en_cours' }),
        matches: [
          buildMatch({ id: 'match-1', equipeAId: 'equipe-1', equipeBId: 'equipe-2', statut: 'a_jouer' }),
        ],
      }),
    );

    renderPage();

    expect(await screen.findByText('Tour n°1 — En cours')).toBeInTheDocument();
    expect(screen.getByText('DSI')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('À jouer')).toBeInTheDocument();
  });

  it('affiche "Becot" pour un match estBye sans équipe B', async () => {
    vi.mocked(tourApi.getTourCourant).mockResolvedValue(
      buildTourCourant({
        matches: [
          buildMatch({
            id: 'match-bye',
            equipeAId: 'equipe-1',
            equipeBId: null,
            estBye: true,
            statut: 'termine',
          }),
        ],
        resultatsComplets: true,
      }),
    );

    renderPage();

    await screen.findByText('Tour n°1 — En cours');
    expect(screen.getByText('Becot')).toBeInTheDocument();
  });

  it('affiche les scores saisis dans des champs de saisie, et un tiret pour un match Becot', async () => {
    vi.mocked(tourApi.getTourCourant).mockResolvedValue(
      buildTourCourant({
        matches: [
          buildMatch({ id: 'match-1', equipeAId: 'equipe-1', equipeBId: 'equipe-2', scoreA: 3, scoreB: 1, statut: 'termine' }),
          buildMatch({ id: 'match-bye', equipeAId: 'equipe-1', equipeBId: null, estBye: true, statut: 'termine' }),
        ],
      }),
    );

    renderPage();

    await screen.findByText('Tour n°1 — En cours');
    expect(screen.getByLabelText('Score DSI')).toHaveValue(3);
    expect(screen.getByLabelText('Score Marketing')).toHaveValue(1);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  describe("Saisie du score d'un match", () => {
    it('le bouton "Enregistrer" est désactivé tant que les deux scores ne sont pas saisis', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [
            buildMatch({ id: 'match-1', equipeAId: 'equipe-1', equipeBId: 'equipe-2', statut: 'a_jouer' }),
          ],
        }),
      );

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();

      fireEvent.change(screen.getByLabelText('Score DSI'), { target: { value: '3' } });
      expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();

      fireEvent.change(screen.getByLabelText('Score Marketing'), { target: { value: '1' } });
      expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
    });

    it('clique sur "Enregistrer" appelle enregistrerScoreMatch avec les scores saisis convertis en nombres', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [
            buildMatch({ id: 'match-1', equipeAId: 'equipe-1', equipeBId: 'equipe-2', statut: 'a_jouer' }),
          ],
        }),
      );
      vi.mocked(tourApi.enregistrerScoreMatch).mockResolvedValue(buildTourCourant());

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      fireEvent.change(screen.getByLabelText('Score DSI'), { target: { value: '3' } });
      fireEvent.change(screen.getByLabelText('Score Marketing'), { target: { value: '1' } });
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

      await vi.waitFor(() => {
        expect(tourApi.enregistrerScoreMatch).toHaveBeenCalledWith('match-1', 3, 1);
      });
    });

    it("rafraîchit le tour courant après l'enregistrement réussi d'un score", async () => {
      vi.mocked(tourApi.getTourCourant)
        .mockResolvedValueOnce(
          buildTourCourant({
            matches: [
              buildMatch({
                id: 'match-1',
                equipeAId: 'equipe-1',
                equipeBId: 'equipe-2',
                scoreA: null,
                scoreB: null,
                statut: 'a_jouer',
              }),
            ],
          }),
        )
        .mockResolvedValueOnce(
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
            ],
            resultatsComplets: true,
          }),
        );
      vi.mocked(tourApi.enregistrerScoreMatch).mockResolvedValue(buildTourCourant());

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      fireEvent.change(screen.getByLabelText('Score DSI'), { target: { value: '3' } });
      fireEvent.change(screen.getByLabelText('Score Marketing'), { target: { value: '1' } });
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

      await vi.waitFor(() => {
        expect(tourApi.getTourCourant).toHaveBeenCalledTimes(2);
      });
    });

    it("affiche un message d'erreur si l'enregistrement du score échoue", async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [
            buildMatch({ id: 'match-1', equipeAId: 'equipe-1', equipeBId: 'equipe-2', statut: 'a_jouer' }),
          ],
        }),
      );
      vi.mocked(tourApi.enregistrerScoreMatch).mockRejectedValue(new Error('Erreur 400'));

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      fireEvent.change(screen.getByLabelText('Score DSI'), { target: { value: '3' } });
      fireEvent.change(screen.getByLabelText('Score Marketing'), { target: { value: '1' } });
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

      expect(await screen.findByText('Erreur 400')).toBeInTheDocument();
    });
  });

  describe('Planning des terrains', () => {
    it('affiche le plateau de planning pour un tour en_cours', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          tour: buildTour({ statut: 'en_cours' }),
          matches: [buildMatch({ id: 'match-1', terrain: 'A', statut: 'a_jouer' })],
        }),
      );

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      expect(screen.getByText('Planning des terrains')).toBeInTheDocument();
      expect(screen.getByText('Terrain A')).toBeInTheDocument();
      expect(screen.getByText('Terrain B')).toBeInTheDocument();
    });

    it('ne montre pas le planning quand le tour est terminé', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({ tour: buildTour({ statut: 'termine' }) }),
      );

      renderPage();

      await screen.findByText('Tour n°1 — Terminé');
      expect(screen.queryByText('Planning des terrains')).not.toBeInTheDocument();
    });

    it('une réorganisation déclenche reorganiserPlanning et met à jour le cache avec la réponse (sans refetch)', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          tour: buildTour({ statut: 'en_cours' }),
          matches: [
            buildMatch({ id: 'match-1', terrain: 'A', statut: 'a_jouer', heureDebutPrevue: '2026-06-21T08:03:00.000Z' }),
            buildMatch({
              id: 'match-2',
              terrain: 'B',
              statut: 'a_jouer',
              heureDebutPrevue: '2026-06-21T08:03:00.000Z',
              equipeAId: 'equipe-2',
              equipeBId: 'equipe-1',
            }),
          ],
        }),
      );
      vi.mocked(tourApi.reorganiserPlanning).mockResolvedValue(
        buildTourCourant({
          tour: buildTour({ statut: 'en_cours' }),
          matches: [
            buildMatch({ id: 'match-1', terrain: 'B', statut: 'a_jouer', heureDebutPrevue: '2026-06-21T08:20:00.000Z' }),
            buildMatch({ id: 'match-2', terrain: 'B', statut: 'a_jouer', heureDebutPrevue: '2026-06-21T08:03:00.000Z' }),
          ],
        }),
      );

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      const itemMatch1 = screen.getByText('DSI – Marketing').closest('.planning-board__match') as HTMLElement;
      const terrainB = screen.getByText('Terrain B').closest('.planning-board__terrain') as HTMLElement;

      fireEvent.dragStart(itemMatch1);
      fireEvent.dragOver(terrainB);
      fireEvent.drop(terrainB);

      await vi.waitFor(() => {
        expect(tourApi.reorganiserPlanning).toHaveBeenCalled();
      });
      expect(vi.mocked(tourApi.reorganiserPlanning).mock.calls[0][0]).toEqual([
        { terrain: 'A', matchIds: [] },
        { terrain: 'B', matchIds: ['match-2', 'match-1'] },
      ]);

      // Le cache est mis à jour directement avec la réponse de la mutation (setQueryData),
      // sans appel supplémentaire à getTourCourant.
      expect(tourApi.getTourCourant).toHaveBeenCalledTimes(1);
    });

    it("affiche un message d'erreur si la réorganisation échoue", async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          tour: buildTour({ statut: 'en_cours' }),
          matches: [
            buildMatch({ id: 'match-1', terrain: 'A', statut: 'a_jouer' }),
            buildMatch({ id: 'match-2', terrain: 'B', statut: 'a_jouer', equipeAId: 'equipe-2', equipeBId: 'equipe-1' }),
          ],
        }),
      );
      vi.mocked(tourApi.reorganiserPlanning).mockRejectedValue(new Error('Erreur 409'));

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      const itemMatch1 = screen.getByText('DSI – Marketing').closest('.planning-board__match') as HTMLElement;
      const terrainB = screen.getByText('Terrain B').closest('.planning-board__terrain') as HTMLElement;

      fireEvent.dragStart(itemMatch1);
      fireEvent.dragOver(terrainB);
      fireEvent.drop(terrainB);

      expect(await screen.findByText('Erreur 409')).toBeInTheDocument();
    });
  });

  it('affiche le tableau de classement avec rang, équipe et statistiques', async () => {
    vi.mocked(tourApi.getTourCourant).mockResolvedValue(
      buildTourCourant({
        classement: [
          buildClassementEntry({ equipeId: 'equipe-1', rang: 1, points: 3, victoires: 1 }),
          buildClassementEntry({ equipeId: 'equipe-2', rang: 2, points: 0, defaites: 1 }),
        ],
      }),
    );

    renderPage();

    const rows = await screen.findAllByRole('row');
    // 1 ligne d'en-tête + 2 lignes de classement
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('DSI')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('affiche "Aucune donnée de classement." quand le classement est vide', async () => {
    vi.mocked(tourApi.getTourCourant).mockResolvedValue(buildTourCourant({ classement: [] }));

    renderPage();

    expect(await screen.findByText('Aucune donnée de classement.')).toBeInTheDocument();
  });

  describe('résultats incomplets (resultatsComplets === false)', () => {
    it('affiche le message d\'avertissement et désactive les deux boutons d\'action', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [buildMatch({ statut: 'a_jouer' })],
          resultatsComplets: false,
        }),
      );

      renderPage();

      expect(
        await screen.findByText('Les résultats du tour en cours ne sont pas tous saisis.'),
      ).toBeInTheDocument();

      const nextRoundButton = screen.getByRole('button', { name: 'Lancer le tour suivant' });
      const finaleButton = screen.getByRole('button', { name: 'Passer en phase finale' });

      expect(nextRoundButton).toBeDisabled();
      expect(finaleButton).toBeDisabled();
    });
  });

  describe('résultats complets (resultatsComplets === true)', () => {
    it('active les boutons et ne montre pas le message d\'avertissement', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [buildMatch({ statut: 'termine' })],
          resultatsComplets: true,
        }),
      );

      renderPage();

      await screen.findByText('Tour n°1 — En cours');

      expect(
        screen.queryByText('Les résultats du tour en cours ne sont pas tous saisis.'),
      ).not.toBeInTheDocument();

      expect(screen.getByRole('button', { name: 'Lancer le tour suivant' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Passer en phase finale' })).toBeEnabled();
    });

    it('le bouton "Lancer le tour suivant" déclenche terminerTour("nouveau_tour")', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [buildMatch({ statut: 'termine' })],
          resultatsComplets: true,
        }),
      );
      vi.mocked(tourApi.terminerTour).mockResolvedValue({
        action: 'nouveau_tour',
        tour: buildTour({ id: 'tour-2', numero: 2 }),
        matches: [],
      });

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      fireEvent.click(screen.getByRole('button', { name: 'Lancer le tour suivant' }));

      await vi.waitFor(() => {
        expect(tourApi.terminerTour).toHaveBeenCalledWith('nouveau_tour', expect.anything());
      });
    });

    it('le bouton "Passer en phase finale" déclenche terminerTour("phase_finale") et affiche le classement final', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [buildMatch({ statut: 'termine' })],
          classement: [buildClassementEntry({ equipeId: 'equipe-1', rang: 1 })],
          resultatsComplets: true,
        }),
      );
      vi.mocked(tourApi.terminerTour).mockResolvedValue({
        action: 'phase_finale',
        classementFinal: [buildClassementEntry({ equipeId: 'equipe-2', rang: 1, points: 9 })],
        phaseFinaleDemarree: true,
      });

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      fireEvent.click(screen.getByRole('button', { name: 'Passer en phase finale' }));

      await vi.waitFor(() => {
        expect(tourApi.terminerTour).toHaveBeenCalledWith('phase_finale');
      });

      expect(await screen.findByText('Classement final')).toBeInTheDocument();
      expect(screen.getByText(/Phase finale déclenchée et démarrée/)).toBeInTheDocument();
      // Le classement final affiché remplace le classement du tour (Marketing à la place de DSI).
      const classementTable = document.querySelector('.tour-classement-table');
      expect(classementTable).not.toBeNull();
      expect(classementTable).toHaveTextContent('Marketing');
      expect(classementTable).not.toHaveTextContent('DSI');
    });

    it('affiche un message d\'erreur si terminerTour échoue', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [buildMatch({ statut: 'termine' })],
          resultatsComplets: true,
        }),
      );
      vi.mocked(tourApi.terminerTour).mockRejectedValue(
        new Error('Les résultats du tour en cours ne sont pas tous saisis'),
      );

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      fireEvent.click(screen.getByRole('button', { name: 'Lancer le tour suivant' }));

      expect(
        await screen.findByText('Les résultats du tour en cours ne sont pas tous saisis'),
      ).toBeInTheDocument();
    });
  });

  describe('Paramètres du tour suivant', () => {
    it('affiche le formulaire préremplie avec les paramètres du tour courant', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          tour: buildTour({
            parametres: {
              nomsTerrains: ['A', 'B'],
              dureeMatchMinutes: 15,
              latenceMinutes: 5,
              delaiDemarrageMinutes: 3,
            },
          }),
          matches: [buildMatch({ statut: 'termine' })],
          resultatsComplets: true,
        }),
      );

      renderPage();

      await screen.findByText('Tour n°1 — En cours');

      expect(screen.getByText('Paramètres du tour suivant')).toBeInTheDocument();
      expect(screen.getByLabelText(/Terrains disponibles/)).toHaveValue('A, B');
      expect(screen.getByLabelText(/Durée d'un match/)).toHaveValue(15);
      expect(screen.getByLabelText(/Temps de latence/)).toHaveValue(5);
      expect(screen.getByLabelText(/Délai de démarrage/)).toHaveValue(3);
    });

    it('envoie les paramètres édités (nomsTerrains découpé, trim, vides filtrés) au clic sur "Lancer le tour suivant"', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [buildMatch({ statut: 'termine' })],
          resultatsComplets: true,
        }),
      );
      vi.mocked(tourApi.terminerTour).mockResolvedValue({
        action: 'nouveau_tour',
        tour: buildTour({ id: 'tour-2', numero: 2 }),
        matches: [],
      });

      renderPage();

      await screen.findByText('Tour n°1 — En cours');

      fireEvent.change(screen.getByLabelText(/Terrains disponibles/), {
        target: { value: 'A, B,  , C' },
      });
      fireEvent.change(screen.getByLabelText(/Durée d'un match/), {
        target: { value: '20' },
      });
      fireEvent.change(screen.getByLabelText(/Temps de latence/), {
        target: { value: '8' },
      });
      fireEvent.change(screen.getByLabelText(/Délai de démarrage/), {
        target: { value: '5' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Lancer le tour suivant' }));

      await vi.waitFor(() => {
        expect(tourApi.terminerTour).toHaveBeenCalledWith('nouveau_tour', {
          nomsTerrains: ['A', 'B', 'C'],
          dureeMatchMinutes: 20,
          latenceMinutes: 8,
          delaiDemarrageMinutes: 5,
        });
      });
    });

    it('disparaît une fois la phase finale déclenchée', async () => {
      vi.mocked(tourApi.getTourCourant).mockResolvedValue(
        buildTourCourant({
          matches: [buildMatch({ statut: 'termine' })],
          resultatsComplets: true,
        }),
      );
      vi.mocked(tourApi.terminerTour).mockResolvedValue({
        action: 'phase_finale',
        classementFinal: [],
        phaseFinaleDemarree: true,
      });

      renderPage();

      await screen.findByText('Tour n°1 — En cours');
      expect(screen.getByText('Paramètres du tour suivant')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Passer en phase finale' }));

      expect(await screen.findByText('Classement final')).toBeInTheDocument();
      expect(screen.queryByText('Paramètres du tour suivant')).not.toBeInTheDocument();
    });
  });

  it('affiche un message d\'erreur si la récupération du tour courant échoue', async () => {
    vi.mocked(tourApi.getTourCourant).mockRejectedValue(new Error('Aucun tour en cours'));

    renderPage();

    expect(await screen.findByText('Aucun tour en cours')).toBeInTheDocument();
  });

  it('affiche "Aucun match pour ce tour." quand le tour n\'a pas de match', async () => {
    vi.mocked(tourApi.getTourCourant).mockResolvedValue(buildTourCourant({ matches: [] }));

    renderPage();

    expect(await screen.findByText('Aucun match pour ce tour.')).toBeInTheDocument();
  });
});
