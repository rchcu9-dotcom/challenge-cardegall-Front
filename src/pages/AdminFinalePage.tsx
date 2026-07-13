import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listEquipes } from '../api/equipe';
import { demarrerPhaseFinale, enregistrerScoreMatchFinale, getPhaseFinaleCourante, MatchFinaleDto } from '../api/finale';
import { PhaseFinaleBracket, TYPE_MATCH_FINALE_LABELS } from '../components/finale/PhaseFinaleBracket';

export function AdminFinalePage() {
  const queryClient = useQueryClient();

  const phaseFinaleQuery = useQuery({
    queryKey: ['phase-finale'],
    queryFn: getPhaseFinaleCourante,
  });

  const equipesQuery = useQuery({
    queryKey: ['equipes'],
    queryFn: listEquipes,
  });

  const demarrerMutation = useMutation({
    mutationFn: demarrerPhaseFinale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-finale'] });
    },
  });

  const enregistrerScoreMutation = useMutation({
    mutationFn: ({ matchId, scoreA, scoreB }: { matchId: string; scoreA: number; scoreB: number }) =>
      enregistrerScoreMatchFinale(matchId, scoreA, scoreB),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-finale'] });
    },
  });

  const phaseFinale = phaseFinaleQuery.data;

  return (
    <div className="page">
      <h1>Phase finale — administration</h1>

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
          <button
            type="button"
            onClick={() => demarrerMutation.mutate()}
            disabled={demarrerMutation.isPending}
          >
            Démarrer la phase finale
          </button>
          {demarrerMutation.isError && (
            <p className="inscription-form__error">{(demarrerMutation.error as Error).message}</p>
          )}
        </section>
      )}

      {phaseFinale && phaseFinale.demarree && (
        <>
          <section className="page__card">
            <PhaseFinaleBracket
              phaseFinale={phaseFinale}
              equipes={equipesQuery.data ?? []}
              renderMatchExtra={(match) =>
                match.statut === 'a_jouer' && match.equipeAId !== null && match.equipeBId !== null ? (
                  <ScoreForm
                    match={match}
                    onSubmit={(scoreA, scoreB) =>
                      enregistrerScoreMutation.mutate({ matchId: match.id, scoreA, scoreB })
                    }
                    disabled={enregistrerScoreMutation.isPending}
                  />
                ) : null
              }
            />
            {enregistrerScoreMutation.isError && (
              <p className="inscription-form__error">
                {(enregistrerScoreMutation.error as Error).message}
              </p>
            )}
          </section>

          {phaseFinale.statut === 'terminee' && (
            <section className="page__card">
              <p>Phase finale terminée.</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ScoreForm({
  match,
  onSubmit,
  disabled,
}: {
  match: MatchFinaleDto;
  onSubmit: (scoreA: number, scoreB: number) => void;
  disabled: boolean;
}) {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  return (
    <form
      className="finale-score-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(scoreA, scoreB);
      }}
    >
      <input
        type="number"
        min="0"
        value={scoreA}
        onChange={(event) => setScoreA(Number(event.target.value))}
        aria-label={`Score équipe A — ${TYPE_MATCH_FINALE_LABELS[match.type]}`}
      />
      <input
        type="number"
        min="0"
        value={scoreB}
        onChange={(event) => setScoreB(Number(event.target.value))}
        aria-label={`Score équipe B — ${TYPE_MATCH_FINALE_LABELS[match.type]}`}
      />
      <button type="submit" disabled={disabled}>
        Enregistrer
      </button>
    </form>
  );
}
