import type { ReactNode } from 'react';
import type { EquipeDto } from '../../api/equipe';
import type { MatchFinaleDto, PhaseFinaleDto, TypeMatchFinale } from '../../api/finale';

export const TYPE_MATCH_FINALE_LABELS: Record<TypeMatchFinale, string> = {
  demi_finale_a: 'Demi-finale 1 (1er vs 4e)',
  demi_finale_b: 'Demi-finale 2 (2e vs 3e)',
  finale_cardebat: 'Finale Cardebat',
  finale_le_gall: 'Finale Le Gall (petite finale)',
};

export interface PhaseFinaleBracketProps {
  phaseFinale: PhaseFinaleDto;
  equipes: EquipeDto[];
  renderMatchExtra?: (match: MatchFinaleDto) => ReactNode;
}

export function PhaseFinaleBracket({ phaseFinale, equipes, renderMatchExtra }: PhaseFinaleBracketProps) {
  const nomEquipe = (equipeId: string | null): string => {
    if (!equipeId) {
      return 'À déterminer';
    }
    const equipe = equipes.find((e) => e.id === equipeId);
    return equipe?.nom ?? equipeId;
  };

  function renderMatch(match: MatchFinaleDto | null, type: TypeMatchFinale) {
    if (!match) {
      return null;
    }
    return (
      <div className="bracket-match" key={type}>
        <h3>{TYPE_MATCH_FINALE_LABELS[type]}</h3>
        <p>
          {nomEquipe(match.equipeAId)} vs {nomEquipe(match.equipeBId)}
        </p>
        <p>
          {match.scoreA !== null && match.scoreB !== null
            ? `${match.scoreA} - ${match.scoreB}`
            : '—'}
        </p>
        {renderMatchExtra?.(match)}
      </div>
    );
  }

  return (
    <div className="bracket">
      <div className="bracket-round">
        <h2>Finales</h2>
        {renderMatch(phaseFinale.finaleCardebat, 'finale_cardebat')}
        {renderMatch(phaseFinale.finaleLeGall, 'finale_le_gall')}
      </div>
      <div className="bracket-round">
        <h2>Demi-finales</h2>
        {renderMatch(phaseFinale.demiFinaleA, 'demi_finale_a')}
        {renderMatch(phaseFinale.demiFinaleB, 'demi_finale_b')}
      </div>
    </div>
  );
}
