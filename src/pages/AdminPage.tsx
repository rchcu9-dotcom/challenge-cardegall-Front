import { Link } from 'react-router-dom';

export function AdminPage() {
  return (
    <div className="page">
      <h1>Administration</h1>

      <section className="page__card">
        <ul className="admin-hub">
          <li className="admin-hub__item">
            <Link to="/admin/equipes">Équipes inscrites</Link>
            <p>Consulter la liste des équipes inscrites avant le jour J.</p>
          </li>
          <li className="admin-hub__item">
            <Link to="/admin/enrolement">Enrôlement jour J</Link>
            <p>Enrôler les équipes présentes et clôturer les enrôlements.</p>
          </li>
          <li className="admin-hub__item">
            <Link to="/admin/tour">Cycle des tours</Link>
            <p>Consulter le tour en cours et décider de la suite (nouveau tour ou phase finale).</p>
          </li>
          <li className="admin-hub__item">
            <Link to="/admin/users">Utilisateurs</Link>
            <p>Gérer les rôles des utilisateurs de l'application.</p>
          </li>
          <li className="admin-hub__item">
            <Link to="/admin/finale">Phase finale</Link>
            <p>Démarrer la phase finale et saisir les résultats des demi-finales et finales.</p>
          </li>
        </ul>
      </section>
    </div>
  );
}
