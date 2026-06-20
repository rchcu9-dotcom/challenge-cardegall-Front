import { useQuery } from '@tanstack/react-query';
import { listEquipes } from '../api/equipe';
import { STATUT_EQUIPE_LABELS } from '../utils/statutEquipe';

export function AdminEquipesPage() {
  const equipesQuery = useQuery({
    queryKey: ['equipes'],
    queryFn: listEquipes,
  });

  const equipes = [...(equipesQuery.data ?? [])].sort((a, b) =>
    a.dateInscription.localeCompare(b.dateInscription),
  );

  return (
    <div className="page">
      <h1>Équipes inscrites</h1>

      <section className="page__card">
        {equipesQuery.isLoading ? (
          <p>Chargement…</p>
        ) : equipes.length === 0 ? (
          <p>Aucune équipe inscrite pour le moment.</p>
        ) : (
          <table className="admin-equipes-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Capitaine</th>
                <th>Joueurs (approx.)</th>
                <th>Féminines envisagées</th>
                <th>Commentaire</th>
                <th>Statut</th>
                <th>Date d'inscription</th>
              </tr>
            </thead>
            <tbody>
              {equipes.map((equipe) => (
                <tr key={equipe.id}>
                  <td>{equipe.nom}</td>
                  <td>{equipe.capitainePseudo ?? equipe.capitaineUserId}</td>
                  <td>{equipe.nbJoueursApprox}</td>
                  <td>{equipe.nbFemininesEnvisage}</td>
                  <td>{equipe.commentaire ?? '—'}</td>
                  <td>{STATUT_EQUIPE_LABELS[equipe.statut]}</td>
                  <td>{new Date(equipe.dateInscription).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
