import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { EnrolementList } from '../components/admin/EnrolementList';
import {
  calculerPlanningProvisoire,
  cloturerEnrolements,
  decloturerEnrolements,
  enrolerEquipe,
  getEnrolementEtat,
  listEnrolees,
  listEquipes,
  reordonnerEquipes,
} from '../api/equipe';
import { getTourCourant } from '../api/tour';

const MIN_EQUIPES_CLOTURE = 2;
const MIN_EQUIPES_PLANNING_PROVISOIRE = 2;

export function AdminEnrolementPage() {
  const queryClient = useQueryClient();
  const [nbFemininesParEquipe, setNbFemininesParEquipe] = useState<Record<string, number>>({});

  const equipesQuery = useQuery({
    queryKey: ['equipes'],
    queryFn: listEquipes,
  });

  const enroleesQuery = useQuery({
    queryKey: ['equipes-enrolees'],
    queryFn: listEnrolees,
  });

  const etatQuery = useQuery({
    queryKey: ['enrolement-etat'],
    queryFn: getEnrolementEtat,
  });

  const tourCourantQuery = useQuery({
    queryKey: ['tour-courant'],
    queryFn: getTourCourant,
    retry: false,
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['equipes'] });
    queryClient.invalidateQueries({ queryKey: ['equipes-enrolees'] });
    queryClient.invalidateQueries({ queryKey: ['enrolement-etat'] });
    queryClient.invalidateQueries({ queryKey: ['tour-courant'] });
  }

  const enrolerMutation = useMutation({
    mutationFn: ({ id, nbFemininesReel }: { id: string; nbFemininesReel: number }) =>
      enrolerEquipe(id, { nbFemininesReel }),
    onSuccess: invalidateAll,
  });

  const reordonnerMutation = useMutation({
    mutationFn: reordonnerEquipes,
    onSuccess: (equipes) => {
      queryClient.setQueryData(['equipes-enrolees'], equipes);
    },
  });

  const cloturerMutation = useMutation({
    mutationFn: cloturerEnrolements,
    onSuccess: invalidateAll,
  });

  const decloturerMutation = useMutation({
    mutationFn: decloturerEnrolements,
    onSuccess: invalidateAll,
  });

  const planningProvisoireMutation = useMutation({
    mutationFn: calculerPlanningProvisoire,
    onSuccess: invalidateAll,
  });

  const aEnroler = (equipesQuery.data ?? []).filter((equipe) => equipe.statut === 'inscrite');
  const enrolees = enroleesQuery.data ?? [];
  const cloture = etatQuery.data?.cloture ?? false;
  const peutCloturer = !cloture && enrolees.length >= MIN_EQUIPES_CLOTURE;
  const tourExiste = tourCourantQuery.isSuccess;
  const peutCalculerPlanningProvisoire =
    !tourExiste && enrolees.length >= MIN_EQUIPES_PLANNING_PROVISOIRE;

  return (
    <div className="page">
      <h1>Enrôlement jour J</h1>

      {cloture && (
        <section className="page__card">
          <p>Les enrôlements sont clôturés. Le tournoi peut démarrer.</p>
        </section>
      )}

      <section className="page__card">
        <h2>Équipes à enrôler</h2>
        {aEnroler.length === 0 ? (
          <p>Toutes les équipes inscrites ont été enrôlées.</p>
        ) : (
          <ul className="enrolement-attente">
            {aEnroler.map((equipe) => (
              <li key={equipe.id} className="enrolement-attente__item">
                <span className="enrolement-attente__nom">{equipe.nom}</span>
                <label>
                  Féminines présentes
                  <input
                    type="number"
                    min={0}
                    value={nbFemininesParEquipe[equipe.id] ?? equipe.nbFemininesEnvisage}
                    onChange={(event) =>
                      setNbFemininesParEquipe((prev) => ({
                        ...prev,
                        [equipe.id]: Number(event.target.value),
                      }))
                    }
                    disabled={cloture}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    enrolerMutation.mutate({
                      id: equipe.id,
                      nbFemininesReel: nbFemininesParEquipe[equipe.id] ?? equipe.nbFemininesEnvisage,
                    })
                  }
                  disabled={cloture || enrolerMutation.isPending}
                >
                  Enrôler
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="page__card">
        <h2>Équipes enrôlées</h2>
        {enroleesQuery.isError ? (
          <p>Impossible de charger les équipes enrôlées : {(enroleesQuery.error as Error).message}</p>
        ) : (
          <EnrolementList
            equipes={enrolees}
            onReorder={(orderedIds) => reordonnerMutation.mutate(orderedIds)}
            disabled={cloture}
          />
        )}
      </section>

      <section className="page__card">
        {!cloture && (
          <>
            <button
              type="button"
              onClick={() => cloturerMutation.mutate()}
              disabled={!peutCloturer || cloturerMutation.isPending}
            >
              Clôturer les enrôlements
            </button>
            {enrolees.length < MIN_EQUIPES_CLOTURE && (
              <p>Au moins {MIN_EQUIPES_CLOTURE} équipes enrôlées sont requises pour clôturer.</p>
            )}
            {cloturerMutation.isError && <p>{(cloturerMutation.error as Error).message}</p>}

            {!tourExiste && (
              <>
                <button
                  type="button"
                  title="Calcule le planning provisoire avec les équipes déjà arrivées — les matchs démarreront immédiatement"
                  onClick={() => planningProvisoireMutation.mutate()}
                  disabled={!peutCalculerPlanningProvisoire || planningProvisoireMutation.isPending}
                >
                  Calculer un planning provisoire
                </button>
                {enrolees.length < MIN_EQUIPES_PLANNING_PROVISOIRE && (
                  <p>
                    Au moins {MIN_EQUIPES_PLANNING_PROVISOIRE} équipes enrôlées sont requises pour
                    calculer un planning provisoire.
                  </p>
                )}
                {planningProvisoireMutation.isError && (
                  <p>{(planningProvisoireMutation.error as Error).message}</p>
                )}
              </>
            )}
            {planningProvisoireMutation.isSuccess && (
              <p>
                Planning provisoire généré.{' '}
                <Link to="/admin/tour" className="link-secondary">
                  Voir le planning
                </Link>
              </p>
            )}
          </>
        )}
        {cloture && (
          <>
            <button
              type="button"
              onClick={() => decloturerMutation.mutate()}
              disabled={decloturerMutation.isPending}
            >
              Décloturer les inscriptions
            </button>
            {decloturerMutation.isError && <p>{(decloturerMutation.error as Error).message}</p>}
          </>
        )}
      </section>
    </div>
  );
}
