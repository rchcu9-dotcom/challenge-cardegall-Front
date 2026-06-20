import type { RoleUtilisateur } from '../api/users';

export const ROLE_LABELS: Record<RoleUtilisateur, string> = {
  admin: 'Admin',
  capitaine: 'Capitaine',
  membre: 'Membre',
};
