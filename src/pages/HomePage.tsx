import { useQuery } from '@tanstack/react-query';
import { listEquipes } from '../api/equipe';

export function HomePage() {
  const equipesQuery = useQuery({
    queryKey: ['equipes'],
    queryFn: listEquipes,
  });

  const equipes = [...(equipesQuery.data ?? [])].sort((a, b) =>
    a.dateInscription.localeCompare(b.dateInscription),
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
        <p>Aucun match planifié pour le moment — revenez après le lancement du premier tour.</p>
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
