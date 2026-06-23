import { useQuery } from '@tanstack/react-query';
import { listEquipes } from '../api/equipe';
import { getTourCourant } from '../api/classement';
import { useSelectedEquipe } from '../hooks/useSelectedEquipe';

export function ResultatsClassementPage() {
  const [selectedEquipeId, setSelectedEquipeId] = useSelectedEquipe();

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

  const classement = tourCourantQuery.data?.classement ?? [];
  const matchesTermines = (tourCourantQuery.data?.tousLesMatchs ?? []).filter(
    (match) => match.statut === 'termine',
  );
  const resultatsFiltres = selectedEquipeId
    ? matchesTermines.filter(
        (match) => match.equipeAId === selectedEquipeId || match.equipeBId === selectedEquipeId,
      )
    : matchesTermines;

  return (
    <div className="page">
      <h1>Résultats &amp; classement</h1>
      <p>
        Résultats des matchs joués et classement général. Sélectionnez votre équipe pour la
        retrouver facilement.
      </p>

      <section className="page__card">
        <h2>Mon équipe</h2>
        <div className="resultats-filtre-equipe">
          <label htmlFor="mon-equipe">Mon équipe :</label>
          <select
            id="mon-equipe"
            value={selectedEquipeId ?? ''}
            onChange={(e) => setSelectedEquipeId(e.target.value || null)}
          >
            <option value="">Toutes les équipes</option>
            {equipesEngagees.map((equipe) => (
              <option key={equipe.id} value={equipe.id}>
                {equipe.nom}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="page__card">
        <h2>Classement</h2>
        {tourCourantQuery.isLoading && <p>Chargement…</p>}
        {tourCourantQuery.isError && <p>{(tourCourantQuery.error as Error).message}</p>}

        {!tourCourantQuery.isLoading && !tourCourantQuery.isError && (
          classement.length === 0 ? (
            <p>Aucune donnée de classement.</p>
          ) : (
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
                  <tr
                    key={entry.equipeId}
                    className={entry.equipeId === selectedEquipeId ? 'is-equipe-selectionnee' : undefined}
                  >
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
          )
        )}
      </section>

      <section className="page__card">
        <h2>Résultats</h2>
        {tourCourantQuery.isLoading && <p>Chargement…</p>}
        {tourCourantQuery.isError && <p>{(tourCourantQuery.error as Error).message}</p>}

        {!tourCourantQuery.isLoading && !tourCourantQuery.isError && (
          resultatsFiltres.length === 0 ? (
            <p>
              {matchesTermines.length === 0
                ? 'Aucun résultat disponible pour le moment.'
                : 'Aucun résultat pour cette équipe pour le moment.'}
            </p>
          ) : (
            <table className="tour-matches-table">
              <thead>
                <tr>
                  <th>Équipe A</th>
                  <th>Équipe B</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {resultatsFiltres.map((match) => (
                  <tr key={match.id}>
                    <td>{nomEquipe(match.equipeAId)}</td>
                    <td>{match.estBye ? 'Becot' : nomEquipe(match.equipeBId)}</td>
                    <td>
                      {match.scoreA !== null && match.scoreB !== null
                        ? `${match.scoreA} - ${match.scoreB}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </section>
    </div>
  );
}
