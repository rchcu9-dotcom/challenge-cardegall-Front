import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminFinalePage } from '../AdminFinalePage';
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
      <AdminFinalePage />
    </QueryClientProvider>,
  );
}

describe('AdminFinalePage', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.listEquipes).mockReset();
    vi.mocked(finaleApi.getPhaseFinaleCourante).mockReset();
    vi.mocked(finaleApi.demarrerPhaseFinale).mockReset();
    vi.mocked(finaleApi.enregistrerScoreMatchFinale).mockReset();

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

  describe('phase finale non démarrée', () => {
    it('affiche le bouton "Démarrer la phase finale"', async () => {
      vi.mocked(finaleApi.getPhaseFinaleCourante).mockResolvedValue(buildPhaseFinale({ demarree: false }));

      renderPage();

      expect(
        await screen.findByText("La phase finale n'a pas encore commencé."),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Démarrer la phase finale' })).toBeInTheDocument();
    });

    it('le bouton "Démarrer la phase finale" déclenche demarrerPhaseFinale', async () => {
      vi.mocked(finaleApi.getPhaseFinaleCourante).mockResolvedValue(buildPhaseFinale({ demarree: false }));
      vi.mocked(finaleApi.demarrerPhaseFinale).mockResolvedValue(
        buildPhaseFinale({
          demarree: true,
          statut: 'en_cours',
          demiFinaleA: buildMatchFinale({ id: 'demi-a', type: 'demi_finale_a' }),
          demiFinaleB: buildMatchFinale({ id: 'demi-b', type: 'demi_finale_b' }),
        }),
      );

      renderPage();

      await screen.findByRole('button', { name: 'Démarrer la phase finale' });
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer la phase finale' }));

      await vi.waitFor(() => {
        expect(finaleApi.demarrerPhaseFinale).toHaveBeenCalledTimes(1);
      });
    });

    it('affiche un message d\'erreur si demarrerPhaseFinale échoue', async () => {
      vi.mocked(finaleApi.getPhaseFinaleCourante).mockResolvedValue(buildPhaseFinale({ demarree: false }));
      vi.mocked(finaleApi.demarrerPhaseFinale).mockRejectedValue(
        new Error("La phase de poules n'est pas terminée"),
      );

      renderPage();

      await screen.findByRole('button', { name: 'Démarrer la phase finale' });
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer la phase finale' }));

      expect(
        await screen.findByText("La phase de poules n'est pas terminée"),
      ).toBeInTheDocument();
    });
  });

  describe('phase finale démarrée', () => {
    it('affiche les brackets et un formulaire de score pour les matchs "a_jouer" avec les deux équipes connues', async () => {
      vi.mocked(finaleApi.getPhaseFinaleCourante).mockResolvedValue(
        buildPhaseFinale({
          demarree: true,
          statut: 'en_cours',
          demiFinaleA: buildMatchFinale({
            id: 'demi-a',
            type: 'demi_finale_a',
            equipeAId: 'equipe-1',
            equipeBId: 'equipe-4',
            statut: 'a_jouer',
          }),
          demiFinaleB: buildMatchFinale({
            id: 'demi-b',
            type: 'demi_finale_b',
            equipeAId: 'equipe-2',
            equipeBId: 'equipe-3',
            statut: 'a_jouer',
          }),
        }),
      );

      renderPage();

      expect(await screen.findByText('DSI vs RH')).toBeInTheDocument();
      expect(screen.getByText('Marketing vs Finance')).toBeInTheDocument();

      // Un formulaire de score par demi-finale à jouer
      const forms = document.querySelectorAll('.finale-score-form');
      expect(forms).toHaveLength(2);
      expect(screen.queryByRole('button', { name: 'Démarrer la phase finale' })).not.toBeInTheDocument();
    });

    it('ne montre pas de formulaire de score pour un match dont une équipe est encore "À déterminer"', async () => {
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
            scoreA: 0,
            scoreB: 2,
            statut: 'termine',
          }),
          finaleCardebat: buildMatchFinale({
            id: 'finale-cardebat',
            type: 'finale_cardebat',
            equipeAId: 'equipe-1',
            equipeBId: 'equipe-3',
            statut: 'a_jouer',
          }),
          finaleLeGall: buildMatchFinale({
            id: 'finale-le-gall',
            type: 'finale_le_gall',
            equipeAId: 'equipe-4',
            equipeBId: 'equipe-2',
            statut: 'a_jouer',
          }),
        }),
      );

      renderPage();

      await screen.findByText('Finale Cardebat');

      // 2 demi-finales terminées (pas de formulaire) + 2 finales à jouer (formulaire chacune)
      const forms = document.querySelectorAll('.finale-score-form');
      expect(forms).toHaveLength(2);
    });

    it("soumettre le formulaire de score déclenche enregistrerScoreMatchFinale avec les valeurs saisies", async () => {
      vi.mocked(finaleApi.getPhaseFinaleCourante).mockResolvedValue(
        buildPhaseFinale({
          demarree: true,
          statut: 'en_cours',
          demiFinaleA: buildMatchFinale({
            id: 'demi-a',
            type: 'demi_finale_a',
            equipeAId: 'equipe-1',
            equipeBId: 'equipe-4',
            statut: 'a_jouer',
          }),
          demiFinaleB: buildMatchFinale({
            id: 'demi-b',
            type: 'demi_finale_b',
            equipeAId: 'equipe-2',
            equipeBId: 'equipe-3',
            statut: 'a_jouer',
          }),
        }),
      );
      vi.mocked(finaleApi.enregistrerScoreMatchFinale).mockResolvedValue(
        buildPhaseFinale({ demarree: true, statut: 'en_cours' }),
      );

      renderPage();

      await screen.findByText('DSI vs RH');

      const scoreAInput = screen.getByLabelText('Score équipe A — Demi-finale 1 (1er vs 4e)');
      const scoreBInput = screen.getByLabelText('Score équipe B — Demi-finale 1 (1er vs 4e)');

      fireEvent.change(scoreAInput, { target: { value: '3' } });
      fireEvent.change(scoreBInput, { target: { value: '1' } });

      const forms = document.querySelectorAll('.finale-score-form');
      fireEvent.submit(forms[0]);

      await vi.waitFor(() => {
        expect(finaleApi.enregistrerScoreMatchFinale).toHaveBeenCalledWith('demi-a', 3, 1);
      });
    });

    it("affiche un message d'erreur si enregistrerScoreMatchFinale échoue", async () => {
      vi.mocked(finaleApi.getPhaseFinaleCourante).mockResolvedValue(
        buildPhaseFinale({
          demarree: true,
          statut: 'en_cours',
          demiFinaleA: buildMatchFinale({
            id: 'demi-a',
            type: 'demi_finale_a',
            equipeAId: 'equipe-1',
            equipeBId: 'equipe-4',
            statut: 'a_jouer',
          }),
        }),
      );
      vi.mocked(finaleApi.enregistrerScoreMatchFinale).mockRejectedValue(
        new Error('Un match de phase finale ne peut pas se terminer sur un score nul'),
      );

      renderPage();

      await screen.findByText('DSI vs RH');

      const forms = document.querySelectorAll('.finale-score-form');
      fireEvent.submit(forms[0]);

      expect(
        await screen.findByText('Un match de phase finale ne peut pas se terminer sur un score nul'),
      ).toBeInTheDocument();
    });

    it('affiche "Phase finale terminée." quand statut === "terminee"', async () => {
      vi.mocked(finaleApi.getPhaseFinaleCourante).mockResolvedValue(
        buildPhaseFinale({
          demarree: true,
          statut: 'terminee',
          demiFinaleA: buildMatchFinale({ id: 'demi-a', type: 'demi_finale_a', statut: 'termine', scoreA: 3, scoreB: 1 }),
          demiFinaleB: buildMatchFinale({ id: 'demi-b', type: 'demi_finale_b', statut: 'termine', scoreA: 0, scoreB: 2 }),
          finaleCardebat: buildMatchFinale({
            id: 'finale-cardebat',
            type: 'finale_cardebat',
            equipeAId: 'equipe-1',
            equipeBId: 'equipe-3',
            statut: 'termine',
            scoreA: 2,
            scoreB: 0,
          }),
          finaleLeGall: buildMatchFinale({
            id: 'finale-le-gall',
            type: 'finale_le_gall',
            equipeAId: 'equipe-4',
            equipeBId: 'equipe-2',
            statut: 'termine',
            scoreA: 1,
            scoreB: 0,
          }),
        }),
      );

      renderPage();

      expect(await screen.findByText('Phase finale terminée.')).toBeInTheDocument();
      expect(document.querySelectorAll('.finale-score-form')).toHaveLength(0);
    });
  });

  it("affiche un message d'erreur si la récupération de la phase finale échoue", async () => {
    vi.mocked(finaleApi.getPhaseFinaleCourante).mockRejectedValue(new Error('Erreur réseau'));

    renderPage();

    expect(await screen.findByText('Erreur réseau')).toBeInTheDocument();
  });
});
