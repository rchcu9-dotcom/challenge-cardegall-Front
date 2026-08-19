import { useQuery } from '@tanstack/react-query';
import { listEquipes } from '../api/equipe';
import { getTourCourant, type MatchDto } from '../api/planning';

function trierProchainsMatchs(matches: MatchDto[]): MatchDto[] {
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

function formatHeure(iso: string | null): string {
  if (!iso) {
    return 'À déterminer';
  }
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function HomePage() {
  const equipesQuery = useQuery({
    queryKey: ['equipes'],
    queryFn: listEquipes,
  });

  const tourCourantQuery = useQuery({
    queryKey: ['tour-courant'],
    queryFn: getTourCourant,
    retry: false,
  });

  const equipes = [...(equipesQuery.data ?? [])].sort((a, b) =>
    a.dateInscription.localeCompare(b.dateInscription),
  );

  const nomEquipe = (equipeId: string | null): string => {
    if (!equipeId) {
      return 'Becot';
    }
    const equipe = (equipesQuery.data ?? []).find((e) => e.id === equipeId);
    return equipe?.nom ?? equipeId;
  };

  const prochainsMatchs = trierProchainsMatchs(
    (tourCourantQuery.data?.matches ?? []).filter((match) => match.statut !== 'termine'),
  );

  return (
    <div className="page">
      <h1>Challenge CardeGall</h1>
      <p>
        Tournoi inter-services Orange Business — format ronde suisse puis phase finale
        Cardebat / Le Gall.
      </p>

      <section className="page__card" id="statut-tournoi">
        <h2>Statut du tournoi</h2>
        <p>
          Les inscriptions sont ouvertes. L'enrôlement des équipes et le premier tour
          démarreront le jour J.
        </p>
        {equipesQuery.isLoading ? (
          <p>Chargement…</p>
        ) : equipes.length === 0 ? (
          <p>Aucune équipe inscrite pour le moment.</p>
        ) : (
          <>
            <p>Les équipes déjà inscrites sont :</p>
            <ul>
              {equipes.map((equipe) => (
                <li key={equipe.id}>{equipe.nom}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="page__card">
        <h2>Prochains matchs</h2>
        {tourCourantQuery.isLoading ? (
          <p>Chargement…</p>
        ) : prochainsMatchs.length === 0 ? (
          <p>Aucun match planifié pour le moment — revenez après le lancement du premier tour.</p>
        ) : (
          <ul>
            {prochainsMatchs.map((match) => (
              <li key={match.id}>
                {nomEquipe(match.equipeAId)} vs {match.estBye ? 'Becot' : nomEquipe(match.equipeBId)}
                {' — '}
                {match.terrain ?? 'Terrain à déterminer'} — {formatHeure(match.heureDebutPrevue)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="page__card">
        <h2>Comment ça marche ?</h2>
        <ul>
          <li>Phase de poules en ronde suisse : appariement par classement sur plusieurs tours.</li>
          <li>Phase finale : demi-finales, puis finale « Cardebat » et petite finale « Le Gall ».</li>
          <li>
            Suivez le <em>Planning</em> pour les horaires et terrains, et les{' '}
            <em>Résultats &amp; classement</em> pour le suivi en direct.
          </li>
        </ul>
      </section>
    </div>
  );
}
