import { useQuery } from '@tanstack/react-query';
import { listEquipes } from '../api/equipe';
import { getTourCourant } from '../api/tour';

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

export function CompetitionPage() {
  const equipesQuery = useQuery({
    queryKey: ['equipes'],
    queryFn: listEquipes,
  });

  const tourCourantQuery = useQuery({
    queryKey: ['tour-courant'],
    queryFn: getTourCourant,
  });

  const equipesEngagees = (equipesQuery.data ?? [])
    .filter((equipe) => equipe.statut === 'engagee')
    .sort((a, b) => (a.ordreArrivee ?? 0) - (b.ordreArrivee ?? 0));

  const nomEquipe = (equipeId: string | null): string => {
    if (!equipeId) {
      return 'Becot';
    }
    const equipe = (equipesQuery.data ?? []).find((e) => e.id === equipeId);
    return equipe?.nom ?? equipeId;
  };

  const tour = tourCourantQuery.data?.tour;
  const matches = tourCourantQuery.data?.matches ?? [];
  const classement = tourCourantQuery.data?.classement ?? [];

  return (
    <div className="page">
      <h1>Compétition</h1>
      <p>
        Tournoi inter-services Orange Business en deux phases : une phase de poules en ronde
        suisse, suivie d'une phase finale « Cardebat / Le Gall ».
      </p>

      <section className="page__card">
        <h2>Format du tournoi</h2>

        <h3>Phase de poules — ronde suisse</h3>
        <p>
          À chaque tour, les équipes sont appariées en fonction de leur classement à l'issue du
          tour précédent (les équipes les mieux classées s'affrontent entre elles, de même pour
          les suivantes). Si le nombre d'équipes est impair, l'une d'entre elles reçoit un
          « becot » (exempte de match) pour ce tour.
        </p>
        <p>Le classement est établi sur les critères suivants, dans cet ordre :</p>
        <ul>
          <li>Points (victoire, match nul, défaite)</li>
          <li>Différence de buts en confrontation directe entre équipes à égalité</li>
          <li>Différence de buts générale sur l'ensemble du tournoi</li>
          <li>Buts marqués</li>
          <li>Nombre de joueuses féminines dans l'effectif</li>
        </ul>

        <h3>Phase finale — Cardebat / Le Gall</h3>
        <p>
          À l'issue de la phase de poules, les quatre premières équipes du classement disputent
          les demi-finales : 1ère équipe contre 4ème, et 2ème équipe contre 3ème. Les deux
          équipes victorieuses se rencontrent en finale « Cardebat », tandis que les deux équipes
          battues en demi-finale s'affrontent dans la petite finale « Le Gall ».
        </p>
      </section>

      <section className="page__card">
        <h2>Équipes engagées</h2>
        {equipesQuery.isLoading && <p>Chargement…</p>}
        {equipesQuery.isError && <p>{(equipesQuery.error as Error).message}</p>}
        {!equipesQuery.isLoading && !equipesQuery.isError && equipesEngagees.length === 0 && (
          <p>La liste des équipes engagées sera publiée après la clôture des enrôlements.</p>
        )}
        {equipesEngagees.length > 0 && (
          <ul className="competition-equipes-list">
            {equipesEngagees.map((equipe) => (
              <li key={equipe.id}>{equipe.nom}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="page__card">
        <h2>État d'avancement</h2>
        {tourCourantQuery.isLoading && <p>Chargement…</p>}
        {tourCourantQuery.isError && <p>{(tourCourantQuery.error as Error).message}</p>}

        {tour && (
          <>
            <h3>
              Tour n°{tour.numero} — {STATUT_TOUR_LABELS[tour.statut] ?? tour.statut}
            </h3>

            {matches.length === 0 ? (
              <p>Aucun match pour ce tour.</p>
            ) : (
              <div className="table-scroll">
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
                    {matches.map((match) => (
                      <tr key={match.id}>
                        <td>{nomEquipe(match.equipeAId)}</td>
                        <td>{match.estBye ? 'Becot' : nomEquipe(match.equipeBId)}</td>
                        <td>
                          {match.scoreA !== null && match.scoreB !== null
                            ? `${match.scoreA} - ${match.scoreB}`
                            : '—'}
                        </td>
                        <td>{STATUT_MATCH_LABELS[match.statut] ?? match.statut}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3>Classement</h3>
            {classement.length === 0 ? (
              <p>Aucune donnée de classement.</p>
            ) : (
              <div className="table-scroll">
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
                    {classement.map((entry) => (
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
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
