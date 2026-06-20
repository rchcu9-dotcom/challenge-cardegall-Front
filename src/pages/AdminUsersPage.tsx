import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listUsers, RoleUtilisateur, updateUserRole } from '../api/users';
import { ROLE_LABELS } from '../utils/roleUtilisateur';

export function AdminUsersPage() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: RoleUtilisateur }) =>
      updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const utilisateurs = usersQuery.data ?? [];

  return (
    <div className="page">
      <h1>Utilisateurs</h1>

      <section className="page__card">
        {usersQuery.isLoading ? (
          <p>Chargement…</p>
        ) : utilisateurs.length === 0 ? (
          <p>Aucun utilisateur pour le moment.</p>
        ) : (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Date d'apparition</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((utilisateur) => {
                const nouveauRole: RoleUtilisateur =
                  utilisateur.role === 'admin' ? 'membre' : 'admin';
                return (
                  <tr key={utilisateur.id}>
                    <td>{utilisateur.displayName}</td>
                    <td>{utilisateur.email ?? '—'}</td>
                    <td>{ROLE_LABELS[utilisateur.role]}</td>
                    <td>{new Date(utilisateur.dateApparition).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          updateRoleMutation.mutate({ id: utilisateur.id, role: nouveauRole })
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        {utilisateur.role === 'admin'
                          ? 'Retirer le rôle admin'
                          : 'Promouvoir admin'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {updateRoleMutation.isError && (
          <p className="inscription-form__error">
            {(updateRoleMutation.error as Error).message}
          </p>
        )}
      </section>
    </div>
  );
}
