import { useQuery } from '@tanstack/react-query';
import { listEquipes } from '../api/equipe';
import { getTourCourant, type MatchDto } from '../api/planning';

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

function formatHeure(iso: string | null): string {
  if (!iso) {
    return 'À déterminer';
  }
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function trierMatches(matches: MatchDto[]): MatchDto[] {
  return matches.slice().sort((a, b) => {
    const terrainA = a.terrain ?? '';
    const terrainB = b.terrain ?? '';
    if (terrainA !== terrainB) {
      if (terrainA === '') return 1;
      if (terrainB === '') return -1;
      return terrainA.localeCompare(terrainB);
    }

    const heureA = a.heureDebutPrevue ?? '';
    const heureB = b.heureDebutPrevue ?? '';
    if (heureA !== heureB) {
      if (heureA === '') return 1;
      if (heureB === '') return -1;
      return heureA.localeCompare(heureB);
    }

    return 0;
  });
}

export function PlanningPage() {
  const equipesQuery = useQuery({
    queryKey: ['equipes'],
    queryFn: listEquipes,
  });

  const tourCourantQuery = useQuery({
    queryKey: ['tour-courant'],
    queryFn: getTourCourant,
  });

  const nomEquipe = (equipeId: string | null): string => {
    if (!equipeId) {
      return 'Becot';
    }
    const equipe = (equipesQuery.data ?? []).find((e) => e.id === equipeId);
    return equipe?.nom ?? equipeId;
  };

  const tour = tourCourantQuery.data?.tour;
  const matches = trierMatches(tourCourantQuery.data?.matches ?? []);
  const aucunTerrainAssigne = matches.length > 0 && matches.every((match) => match.terrain === null);

  return (
    <div className="page">
      <h1>Planning</h1>
      <p>
        Matchs du tour en cours, avec le terrain assigné et l'horaire prévu (quand ils sont
        disponibles).
      </p>

      <section className="page__card">
        {tourCourantQuery.isLoading && <p>Chargement…</p>}
        {tourCourantQuery.isError && <p>{(tourCourantQuery.error as Error).message}</p>}

        {tour && (
          <>
            <h2>
              Tour n°{tour.numero} — {STATUT_TOUR_LABELS[tour.statut] ?? tour.statut}
            </h2>

            {matches.length === 0 ? (
              <p>Aucun match planifié pour ce tour.</p>
            ) : (
              <table className="planning-matches-table">
                <thead>
                  <tr>
                    <th>Terrain</th>
                    <th>Horaire</th>
                    <th>Équipe A</th>
                    <th>Équipe B</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match.id}>
                      <td>{match.terrain ?? 'À déterminer'}</td>
                      <td>
                        {match.heureDebutPrevue === null && match.heureFinPrevue === null
                          ? 'À déterminer'
                          : `${formatHeure(match.heureDebutPrevue)} – ${formatHeure(match.heureFinPrevue)}`}
                      </td>
                      <td>{nomEquipe(match.equipeAId)}</td>
                      <td>{match.estBye ? 'Becot' : nomEquipe(match.equipeBId)}</td>
                      <td>{STATUT_MATCH_LABELS[match.statut] ?? match.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {aucunTerrainAssigne && (
              <p>
                Les terrains et horaires précis seront affichés une fois les paramètres du tour
                (terrains disponibles, durée des matchs, temps de préparation) saisis par
                l'organisation.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
