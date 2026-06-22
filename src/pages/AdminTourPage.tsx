import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlanningBoard } from '../components/admin/PlanningBoard';
import { listEquipes } from '../api/equipe';
import {
  ActionFinTour,
  ClassementEntryDto,
  enregistrerScoreMatch,
  getTourCourant,
  ParametresTour,
  reorganiserPlanning,
  terminerTour,
  TerminerTourResultDto,
  TerrainPlanningDto,
} from '../api/tour';

interface ParametresTourForm {
  nomsTerrains: string;
  dureeMatchMinutes: number;
  latenceMinutes: number;
  delaiDemarrageMinutes: number;
}

function parametresTourToForm(parametres: ParametresTour): ParametresTourForm {
  return {
    nomsTerrains: parametres.nomsTerrains.join(', '),
    dureeMatchMinutes: parametres.dureeMatchMinutes,
    latenceMinutes: parametres.latenceMinutes,
    delaiDemarrageMinutes: parametres.delaiDemarrageMinutes,
  };
}

function formToParametresTour(form: ParametresTourForm): ParametresTour {
  return {
    nomsTerrains: form.nomsTerrains
      .split(',')
      .map((nom) => nom.trim())
      .filter((nom) => nom.length > 0),
    dureeMatchMinutes: form.dureeMatchMinutes,
    latenceMinutes: form.latenceMinutes,
    delaiDemarrageMinutes: form.delaiDemarrageMinutes,
  };
}

const STATUT_TOUR_LABELS: Record<string, string> = {
  planifie: 'Planifié',
  en_cours: 'En cours',
  termine: 'Terminé',
};

const STATUT_MATCH_LABELS: Record<string, string> = {
  a_jouer: 'À jouer',
  en_cours: 'En cours',
  termine: 'Terminé',
};

export function AdminTourPage() {
  const queryClient = useQueryClient();
  const [resultatFinTour, setResultatFinTour] = useState<TerminerTourResultDto | null>(null);
  const [parametresForm, setParametresForm] = useState<ParametresTourForm | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { scoreA: string; scoreB: string }>>(
    {},
  );

  const tourCourantQuery = useQuery({
    queryKey: ['tour-courant'],
    queryFn: getTourCourant,
  });

  const equipesQuery = useQuery({
    queryKey: ['equipes'],
    queryFn: listEquipes,
  });

  const tour = tourCourantQuery.data?.tour;
  // Ne resynchronise le formulaire que lorsque le tour courant change (pas à chaque refetch),
  // pour ne pas écraser une édition en cours de l'admin.
  useEffect(() => {
    if (tour) {
      setParametresForm(parametresTourToForm(tour.parametres));
    }
  }, [tour?.id]);

  // Initialise la saisie de score pour chaque nouveau match (par id), sans écraser
  // une saisie en cours sur les matchs déjà affichés lors d'un refetch.
  useEffect(() => {
    const data = tourCourantQuery.data;
    if (!data) {
      return;
    }
    setScoreInputs((current) => {
      let changed = false;
      const next = { ...current };
      for (const match of data.matches) {
        if (!(match.id in next)) {
          next[match.id] = {
            scoreA: match.scoreA !== null ? String(match.scoreA) : '',
            scoreB: match.scoreB !== null ? String(match.scoreB) : '',
          };
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [tourCourantQuery.data]);

  const nomEquipe = (equipeId: string | null): string => {
    if (!equipeId) {
      return 'Becot';
    }
    const equipe = (equipesQuery.data ?? []).find((e) => e.id === equipeId);
    return equipe?.nom ?? equipeId;
  };

  const terminerTourMutation = useMutation({
    mutationFn: ({ action, parametres }: { action: ActionFinTour; parametres?: ParametresTour }) =>
      parametres ? terminerTour(action, parametres) : terminerTour(action),
    onSuccess: (result) => {
      setResultatFinTour(result);
      queryClient.invalidateQueries({ queryKey: ['tour-courant'] });
    },
  });

  const enregistrerScoreMutation = useMutation({
    mutationFn: ({ matchId, scoreA, scoreB }: { matchId: string; scoreA: number; scoreB: number }) =>
      enregistrerScoreMatch(matchId, scoreA, scoreB),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-courant'] });
    },
  });

  const reorganiserPlanningMutation = useMutation({
    mutationFn: reorganiserPlanning,
    onSuccess: (data) => {
      queryClient.setQueryData(['tour-courant'], data);
    },
  });

  const matches = tourCourantQuery.data?.matches ?? [];
  const classement = resultatFinTour?.action === 'phase_finale'
    ? resultatFinTour.classementFinal
    : tourCourantQuery.data?.classement ?? [];
  const resultatsComplets = tourCourantQuery.data?.resultatsComplets ?? false;

  function renderClassementTable(entries: ClassementEntryDto[]) {
    return (
      <table className="tour-classement-table">
        <thead>
          <tr>
            <th>Rang</th>
            <th>Équipe</th>
            <th>Pts</th>
            <th>V</th>
            <th>N</th>
            <th>D</th>
            <th>Buts marqués</th>
            <th>Buts concédés</th>
            <th>Diff.</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.equipeId}>
              <td>{entry.rang}</td>
              <td>{nomEquipe(entry.equipeId)}</td>
              <td>{entry.points}</td>
              <td>{entry.victoires}</td>
              <td>{entry.nuls}</td>
              <td>{entry.defaites}</td>
              <td>{entry.butsMarques}</td>
              <td>{entry.butsConcedes}</td>
              <td>{entry.diffGenerale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="page">
      <h1>Cycle des tours</h1>

      {tourCourantQuery.isLoading && (
        <section className="page__card">
          <p>Chargement…</p>
        </section>
      )}

      {tourCourantQuery.isError && (
        <section className="page__card">
          <p>{(tourCourantQuery.error as Error).message}</p>
        </section>
      )}

      {tour && (
        <section className="page__card">
          <h2>
            Tour n°{tour.numero} — {STATUT_TOUR_LABELS[tour.statut] ?? tour.statut}
          </h2>

          {matches.length === 0 ? (
            <p>Aucun match pour ce tour.</p>
          ) : (
            <table className="tour-matches-table">
              <thead>
                <tr>
                  <th>Équipe A</th>
                  <th>Équipe B</th>
                  <th>Score</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => {
                  const input = scoreInputs[match.id] ?? { scoreA: '', scoreB: '' };
                  const scoreAValide = input.scoreA !== '' && !Number.isNaN(Number(input.scoreA));
                  const scoreBValide = input.scoreB !== '' && !Number.isNaN(Number(input.scoreB));

                  return (
                    <tr key={match.id}>
                      <td>{nomEquipe(match.equipeAId)}</td>
                      <td>{match.estBye ? 'Becot' : nomEquipe(match.equipeBId)}</td>
                      <td>
                        {match.estBye ? (
                          '—'
                        ) : (
                          <div className="tour-matches-table__score-form">
                            <input
                              type="number"
                              min={0}
                              aria-label={`Score ${nomEquipe(match.equipeAId)}`}
                              value={input.scoreA}
                              onChange={(e) =>
                                setScoreInputs({
                                  ...scoreInputs,
                                  [match.id]: { ...input, scoreA: e.target.value },
                                })
                              }
                            />
                            <span>-</span>
                            <input
                              type="number"
                              min={0}
                              aria-label={`Score ${nomEquipe(match.equipeBId)}`}
                              value={input.scoreB}
                              onChange={(e) =>
                                setScoreInputs({
                                  ...scoreInputs,
                                  [match.id]: { ...input, scoreB: e.target.value },
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                enregistrerScoreMutation.mutate({
                                  matchId: match.id,
                                  scoreA: Number(input.scoreA),
                                  scoreB: Number(input.scoreB),
                                })
                              }
                              disabled={
                                !scoreAValide || !scoreBValide || enregistrerScoreMutation.isPending
                              }
                            >
                              Enregistrer
                            </button>
                          </div>
                        )}
                      </td>
                      <td>{STATUT_MATCH_LABELS[match.statut] ?? match.statut}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {enregistrerScoreMutation.isError && (
            <p className="inscription-form__error">
              {(enregistrerScoreMutation.error as Error).message}
            </p>
          )}
        </section>
      )}

      {tour && tour.statut === 'en_cours' && !resultatFinTour && (
        <section className="page__card">
          <h2>Planning des terrains</h2>
          <PlanningBoard
            matches={matches}
            parametresTour={tour.parametres}
            nomEquipe={nomEquipe}
            onReorganiser={(parTerrain: TerrainPlanningDto[]) =>
              reorganiserPlanningMutation.mutate(parTerrain)
            }
            disabled={reorganiserPlanningMutation.isPending}
          />
          {reorganiserPlanningMutation.isError && (
            <p className="inscription-form__error">
              {(reorganiserPlanningMutation.error as Error).message}
            </p>
          )}
        </section>
      )}

      <section className="page__card">
        <h2>
          {resultatFinTour?.action === 'phase_finale' ? 'Classement final' : 'Classement'}
        </h2>
        {classement.length === 0 ? <p>Aucune donnée de classement.</p> : renderClassementTable(classement)}
      </section>

      {resultatFinTour?.action === 'phase_finale' && (
        <section className="page__card">
          {resultatFinTour.phaseFinaleDemarree ? (
            <p>
              Phase finale déclenchée et démarrée (demi-finales créées) — classement final
              ci-dessus. <Link to="/admin/finale">Voir la phase finale</Link>.
            </p>
          ) : (
            <p>
              Phase finale déclenchée — classement final ci-dessus. Les demi-finales n'ont pas pu
              être créées automatiquement (il faut au moins 4 équipes au classement final).
              Réessayez depuis <Link to="/admin/finale">la page Phase finale</Link>.
            </p>
          )}
        </section>
      )}

      {tour && tour.statut === 'en_cours' && !resultatFinTour && parametresForm && (
        <section className="page__card">
          <h2>Paramètres du tour suivant</h2>
          <form className="inscription-form" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="parametres-noms-terrains">
              Terrains disponibles (séparés par des virgules)
              <input
                id="parametres-noms-terrains"
                type="text"
                value={parametresForm.nomsTerrains}
                onChange={(e) =>
                  setParametresForm({ ...parametresForm, nomsTerrains: e.target.value })
                }
              />
            </label>
            <label htmlFor="parametres-duree-match">
              Durée d'un match (minutes)
              <input
                id="parametres-duree-match"
                type="number"
                min={1}
                value={parametresForm.dureeMatchMinutes}
                onChange={(e) =>
                  setParametresForm({ ...parametresForm, dureeMatchMinutes: Number(e.target.value) })
                }
              />
            </label>
            <label htmlFor="parametres-latence">
              Temps de latence entre deux matchs (minutes)
              <input
                id="parametres-latence"
                type="number"
                min={0}
                value={parametresForm.latenceMinutes}
                onChange={(e) =>
                  setParametresForm({ ...parametresForm, latenceMinutes: Number(e.target.value) })
                }
              />
            </label>
            <label htmlFor="parametres-delai-demarrage">
              Délai de démarrage du premier match (minutes)
              <input
                id="parametres-delai-demarrage"
                type="number"
                min={0}
                value={parametresForm.delaiDemarrageMinutes}
                onChange={(e) =>
                  setParametresForm({
                    ...parametresForm,
                    delaiDemarrageMinutes: Number(e.target.value),
                  })
                }
              />
            </label>
          </form>
        </section>
      )}

      {tour && tour.statut === 'en_cours' && !resultatFinTour && (
        <section className="page__card">
          {!resultatsComplets && (
            <p>Les résultats du tour en cours ne sont pas tous saisis.</p>
          )}
          <div className="tour-actions">
            <button
              type="button"
              onClick={() =>
                terminerTourMutation.mutate({
                  action: 'nouveau_tour',
                  parametres: parametresForm ? formToParametresTour(parametresForm) : undefined,
                })
              }
              disabled={!resultatsComplets || terminerTourMutation.isPending}
            >
              Lancer le tour suivant
            </button>
            <button
              type="button"
              onClick={() => terminerTourMutation.mutate({ action: 'phase_finale' })}
              disabled={!resultatsComplets || terminerTourMutation.isPending}
            >
              Passer en phase finale
            </button>
          </div>
          {terminerTourMutation.isError && (
            <p className="inscription-form__error">{(terminerTourMutation.error as Error).message}</p>
          )}
        </section>
      )}
    </div>
  );
}
