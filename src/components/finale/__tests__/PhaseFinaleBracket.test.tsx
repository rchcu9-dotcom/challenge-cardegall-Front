import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhaseFinaleBracket } from '../PhaseFinaleBracket';
import type { EquipeDto } from '../../../api/equipe';
import type { MatchFinaleDto, PhaseFinaleDto } from '../../../api/finale';

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
    demarree: true,
    statut: 'en_cours',
    demiFinaleA: null,
    demiFinaleB: null,
    finaleCardebat: null,
    finaleLeGall: null,
    ...overrides,
  };
}

const EQUIPES: EquipeDto[] = [
  buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
  buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
  buildEquipe({ id: 'equipe-3', nom: 'Finance' }),
  buildEquipe({ id: 'equipe-4', nom: 'RH' }),
];

describe('PhaseFinaleBracket', () => {
  it('affiche les demi-finales avec les noms des équipes', () => {
    render(
      <PhaseFinaleBracket
        phaseFinale={buildPhaseFinale({
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
        })}
        equipes={EQUIPES}
      />,
    );

    expect(screen.getByText('Demi-finale 1 (1er vs 4e)')).toBeInTheDocument();
    expect(screen.getByText('Demi-finale 2 (2e vs 3e)')).toBeInTheDocument();
    expect(screen.getByText('DSI vs RH')).toBeInTheDocument();
    expect(screen.getByText('Marketing vs Finance')).toBeInTheDocument();
  });

  it('ne rend rien pour un match null (finales pas encore déterminées)', () => {
    render(
      <PhaseFinaleBracket
        phaseFinale={buildPhaseFinale({ finaleCardebat: null, finaleLeGall: null })}
        equipes={EQUIPES}
      />,
    );

    expect(screen.queryByText('Finale Cardebat')).not.toBeInTheDocument();
    expect(screen.queryByText('Finale Le Gall (petite finale)')).not.toBeInTheDocument();
  });

  it('affiche le score quand il est connu, sinon un tiret', () => {
    render(
      <PhaseFinaleBracket
        phaseFinale={buildPhaseFinale({
          demiFinaleA: buildMatchFinale({
            id: 'demi-a',
            type: 'demi_finale_a',
            scoreA: 3,
            scoreB: 1,
            statut: 'termine',
          }),
          demiFinaleB: buildMatchFinale({
            id: 'demi-b',
            type: 'demi_finale_b',
            scoreA: null,
            scoreB: null,
            statut: 'a_jouer',
          }),
        })}
        equipes={EQUIPES}
      />,
    );

    expect(screen.getByText('3 - 1')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('résout "À déterminer" pour une équipe non encore connue et l\'id brut si l\'équipe est introuvable', () => {
    render(
      <PhaseFinaleBracket
        phaseFinale={buildPhaseFinale({
          finaleCardebat: buildMatchFinale({
            id: 'finale-cardebat',
            type: 'finale_cardebat',
            equipeAId: null,
            equipeBId: 'equipe-inconnue',
          }),
        })}
        equipes={EQUIPES}
      />,
    );

    expect(screen.getByText('À déterminer vs equipe-inconnue')).toBeInTheDocument();
  });

  it('invoque renderMatchExtra pour chaque match rendu et omet le slot quand il est absent', () => {
    render(
      <PhaseFinaleBracket
        phaseFinale={buildPhaseFinale({
          demiFinaleA: buildMatchFinale({ id: 'demi-a', type: 'demi_finale_a' }),
        })}
        equipes={EQUIPES}
        renderMatchExtra={(match) => <span data-testid="extra">{match.id}</span>}
      />,
    );

    expect(screen.getByTestId('extra')).toHaveTextContent('demi-a');
  });

  it("n'affiche aucun slot extra quand renderMatchExtra n'est pas fourni", () => {
    render(
      <PhaseFinaleBracket
        phaseFinale={buildPhaseFinale({
          demiFinaleA: buildMatchFinale({ id: 'demi-a', type: 'demi_finale_a' }),
        })}
        equipes={EQUIPES}
      />,
    );

    expect(screen.queryByTestId('extra')).not.toBeInTheDocument();
  });
});
