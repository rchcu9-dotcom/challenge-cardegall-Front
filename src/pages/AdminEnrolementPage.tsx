import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EnrolementList } from '../components/admin/EnrolementList';
import {
  cloturerEnrolements,
  enrolerEquipe,
  getEnrolementEtat,
  listEnrolees,
  listEquipes,
  reordonnerEquipes,
} from '../api/equipe';

const MIN_EQUIPES_CLOTURE = 2;

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

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['equipes'] });
    queryClient.invalidateQueries({ queryKey: ['equipes-enrolees'] });
    queryClient.invalidateQueries({ queryKey: ['enrolement-etat'] });
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

  const aEnroler = (equipesQuery.data ?? []).filter((equipe) => equipe.statut === 'inscrite');
  const enrolees = enroleesQuery.data ?? [];
  const cloture = etatQuery.data?.cloture ?? false;
  const peutCloturer = !cloture && enrolees.length >= MIN_EQUIPES_CLOTURE;

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
        <EnrolementList
          equipes={enrolees}
          onReorder={(orderedIds) => reordonnerMutation.mutate(orderedIds)}
          disabled={cloture}
        />
      </section>

      <section className="page__card">
        <button
          type="button"
          onClick={() => cloturerMutation.mutate()}
          disabled={!peutCloturer || cloturerMutation.isPending}
        >
          Clôturer les enrôlements
        </button>
        {!cloture && enrolees.length < MIN_EQUIPES_CLOTURE && (
          <p>Au moins {MIN_EQUIPES_CLOTURE} équipes enrôlées sont requises pour clôturer.</p>
        )}
        {cloturerMutation.isError && <p>{(cloturerMutation.error as Error).message}</p>}
      </section>
    </div>
  );
}
