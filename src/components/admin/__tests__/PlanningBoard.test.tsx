import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanningBoard } from '../PlanningBoard';
import type { MatchDto, ParametresTour } from '../../../api/tour';

function buildMatch(overrides: Partial<MatchDto> = {}): MatchDto {
  return {
    id: 'match-1',
    tourId: 'tour-1',
    equipeAId: 'equipe-1',
    equipeBId: 'equipe-2',
    estBye: false,
    terrain: 'A',
    heureDebutPrevue: '2026-06-21T08:03:00.000Z',
    heureFinPrevue: '2026-06-21T08:13:00.000Z',
    scoreA: null,
    scoreB: null,
    statut: 'a_jouer',
    ...overrides,
  };
}

const PARAMETRES: ParametresTour = {
  nomsTerrains: ['A', 'B'],
  dureeMatchMinutes: 10,
  latenceMinutes: 2,
  delaiDemarrageMinutes: 3,
};

const NOMS_EQUIPES: Record<string, string> = {
  'equipe-1': 'DSI',
  'equipe-2': 'Marketing',
  'equipe-3': 'Logistique',
};

function nomEquipe(equipeId: string | null): string {
  if (!equipeId) return 'Becot';
  return NOMS_EQUIPES[equipeId] ?? equipeId;
}

function renderBoard(matches: MatchDto[], extra: Partial<Parameters<typeof PlanningBoard>[0]> = {}) {
  const onReorganiser = vi.fn();
  const utils = render(
    <PlanningBoard
      matches={matches}
      parametresTour={PARAMETRES}
      nomEquipe={nomEquipe}
      onReorganiser={onReorganiser}
      {...extra}
    />,
  );
  return { ...utils, onReorganiser };
}

describe('PlanningBoard', () => {
  it('affiche une carte par terrain défini dans les paramètres du tour', () => {
    renderBoard([]);

    expect(screen.getByText('Terrain A')).toBeInTheDocument();
    expect(screen.getByText('Terrain B')).toBeInTheDocument();
  });

  it("n'affiche pas le match Becot/bye sur le plateau", () => {
    const becot = buildMatch({
      id: 'match-becot',
      equipeAId: 'equipe-3',
      equipeBId: null,
      estBye: true,
      terrain: null,
      statut: 'termine',
    });

    renderBoard([becot]);

    expect(screen.queryByText('Logistique')).not.toBeInTheDocument();
    expect(screen.getAllByText('Aucun match sur ce terrain.')).toHaveLength(2);
  });

  it('affiche les matchs éditables du terrain, triés par heure de début, avec les noms des équipes', () => {
    const matchTard = buildMatch({
      id: 'match-2',
      terrain: 'A',
      heureDebutPrevue: '2026-06-21T08:15:00.000Z',
      equipeAId: 'equipe-2',
      equipeBId: 'equipe-3',
    });
    const matchTot = buildMatch({
      id: 'match-1',
      terrain: 'A',
      heureDebutPrevue: '2026-06-21T08:03:00.000Z',
      equipeAId: 'equipe-1',
      equipeBId: 'equipe-2',
    });

    const { container } = renderBoard([matchTard, matchTot]);

    const terrainA = screen.getByText('Terrain A').closest('.planning-board__terrain') as HTMLElement;
    const items = terrainA.querySelectorAll('.planning-board__match');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('DSI – Marketing');
    expect(items[1]).toHaveTextContent('Marketing – Logistique');
    expect(container.querySelectorAll('.planning-board__terrain')).toHaveLength(2);
  });

  it('affiche "À déterminer" quand un match éditable n’a pas encore d’heure de début', () => {
    renderBoard([buildMatch({ heureDebutPrevue: null, heureFinPrevue: null })]);

    expect(screen.getByText('À déterminer')).toBeInTheDocument();
  });

  it('affiche les matchs figés (statut différent de a_jouer) en lecture seule, sans les rendre draggable', () => {
    const fige = buildMatch({ id: 'match-fige', terrain: 'A', statut: 'en_cours' });

    renderBoard([fige]);

    const item = screen.getByText('DSI – Marketing').closest('.planning-board__match') as HTMLElement;
    expect(item).toHaveClass('planning-board__match--fige');
    expect(item).not.toHaveAttribute('draggable', 'true');
  });

  it('affiche "Aucun match sur ce terrain." pour un terrain sans match éditable ni figé', () => {
    renderBoard([buildMatch({ terrain: 'A' })]);

    const terrainB = screen.getByText('Terrain B').closest('.planning-board__terrain') as HTMLElement;
    expect(terrainB).toHaveTextContent('Aucun match sur ce terrain.');
  });

  it('réordonnancement intra-terrain : glisser un match au-dessus d’un autre du même terrain appelle onReorganiser avec le nouvel ordre', () => {
    const match1 = buildMatch({ id: 'match-1', terrain: 'A', heureDebutPrevue: '2026-06-21T08:03:00.000Z' });
    const match2 = buildMatch({ id: 'match-2', terrain: 'A', heureDebutPrevue: '2026-06-21T08:15:00.000Z' });

    const { onReorganiser } = renderBoard([match1, match2]);

    const items = document.querySelectorAll('.planning-board__match');
    fireEvent.dragStart(items[1]); // match-2
    fireEvent.dragOver(items[0]);
    fireEvent.drop(items[0]); // déposé sur match-1

    expect(onReorganiser).toHaveBeenCalledTimes(1);
    expect(onReorganiser).toHaveBeenCalledWith([
      { terrain: 'A', matchIds: ['match-2', 'match-1'] },
      { terrain: 'B', matchIds: [] },
    ]);
  });

  it('déplacement inter-terrain : glisser un match d’un terrain vers un autre met à jour son terrain et l’insère à la position de dépôt', () => {
    const match1 = buildMatch({ id: 'match-1', terrain: 'A', equipeAId: 'equipe-1', equipeBId: 'equipe-2' });
    const match2 = buildMatch({ id: 'match-2', terrain: 'B', equipeAId: 'equipe-2', equipeBId: 'equipe-3' });

    const { onReorganiser } = renderBoard([match1, match2]);

    const itemMatch1 = screen.getByText('DSI – Marketing').closest('.planning-board__match') as HTMLElement;
    const terrainB = screen.getByText('Terrain B').closest('.planning-board__terrain') as HTMLElement;

    fireEvent.dragStart(itemMatch1);
    fireEvent.dragOver(terrainB);
    fireEvent.drop(terrainB);

    expect(onReorganiser).toHaveBeenCalledTimes(1);
    expect(onReorganiser).toHaveBeenCalledWith([
      { terrain: 'A', matchIds: [] },
      { terrain: 'B', matchIds: ['match-2', 'match-1'] },
    ]);
  });

  it('ne déplace rien quand on dépose un match sur lui-même', () => {
    const match1 = buildMatch({ id: 'match-1', terrain: 'A' });

    const { onReorganiser } = renderBoard([match1]);

    const item = document.querySelector('.planning-board__match') as HTMLElement;
    fireEvent.dragStart(item);
    fireEvent.dragOver(item);
    fireEvent.drop(item);

    expect(onReorganiser).not.toHaveBeenCalled();
  });

  it('les matchs ne sont pas draggable quand le plateau est désactivé, et aucun drop ne déclenche onReorganiser', () => {
    const match1 = buildMatch({ id: 'match-1', terrain: 'A' });
    const match2 = buildMatch({ id: 'match-2', terrain: 'B' });

    const { onReorganiser } = renderBoard([match1, match2], { disabled: true });

    const items = document.querySelectorAll('.planning-board__match');
    expect(items[0]).toHaveAttribute('draggable', 'false');

    fireEvent.dragStart(items[0]);
    fireEvent.dragOver(items[1]);
    fireEvent.drop(items[1]);

    expect(onReorganiser).not.toHaveBeenCalled();
  });
});
