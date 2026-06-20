import { useQuery } from '@tanstack/react-query';
import { listEquipes } from '../api/equipe';
import { getPhaseFinaleCourante, MatchFinaleDto, TypeMatchFinale } from '../api/finale';

const TYPE_MATCH_FINALE_LABELS: Record<TypeMatchFinale, string> = {
  demi_finale_a: 'Demi-finale 1 (1er vs 4e)',
  demi_finale_b: 'Demi-finale 2 (2e vs 3e)',
  finale_cardebat: 'Finale Cardebat',
  finale_le_gall: 'Finale Le Gall (petite finale)',
};

export function PhaseFinalePage() {
  const phaseFinaleQuery = useQuery({
    queryKey: ['phase-finale'],
    queryFn: getPhaseFinaleCourante,
  });

  const equipesQuery = useQuery({
    queryKey: ['equipes'],
    queryFn: listEquipes,
  });

  const nomEquipe = (equipeId: string | null): string => {
    if (!equipeId) {
      return 'À déterminer';
    }
    const equipe = (equipesQuery.data ?? []).find((e) => e.id === equipeId);
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
      </div>
    );
  }

  const phaseFinale = phaseFinaleQuery.data;

  return (
    <div className="page">
      <h1>Phase finale</h1>

      {phaseFinaleQuery.isLoading && (
        <section className="page__card">
          <p>Chargement…</p>
        </section>
      )}

      {phaseFinaleQuery.isError && (
        <section className="page__card">
          <p>{(phaseFinaleQuery.error as Error).message}</p>
        </section>
      )}

      {phaseFinale && !phaseFinale.demarree && (
        <section className="page__card">
          <p>La phase finale n'a pas encore commencé.</p>
        </section>
      )}

      {phaseFinale && phaseFinale.demarree && (
        <section className="page__card">
          <div className="bracket">
            <div className="bracket-round">
              <h2>Demi-finales</h2>
              {renderMatch(phaseFinale.demiFinaleA, 'demi_finale_a')}
              {renderMatch(phaseFinale.demiFinaleB, 'demi_finale_b')}
            </div>
            <div className="bracket-round">
              <h2>Finales</h2>
              {renderMatch(phaseFinale.finaleCardebat, 'finale_cardebat')}
              {renderMatch(phaseFinale.finaleLeGall, 'finale_le_gall')}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
