export interface TabConfig {
  id: string;
  label: string;
  shortLabel: string;
  path: string;
  /** Si `true`, le tab n'est affiché que si l'utilisateur connecté a le rôle `admin`. */
  requiresAdmin?: boolean;
}

/**
 * Ids (dans l'ordre d'affichage) des items mis en avant dans le bandeau
 * (haut en desktop, bas en mobile), selon l'état de clôture des enrôlements.
 * Le reste des items visibles bascule dans le menu "Plus"/hamburger complet.
 */
export function getPrimaryTabIds(cloture: boolean): string[] {
  return cloture
    ? ['accueil', 'planning', 'resultats']
    : ['accueil', 'competition', 'inscription'];
}

export const tabsConfig: TabConfig[] = [
  { id: 'accueil', label: 'Accueil', shortLabel: 'Accueil', path: '/' },
  { id: 'competition', label: 'Compétition', shortLabel: 'Compét.', path: '/competition' },
  { id: 'planning', label: 'Planning', shortLabel: 'Planning', path: '/planning' },
  { id: 'resultats', label: 'Résultats & classement', shortLabel: 'Résultats', path: '/resultats' },
  { id: 'finale', label: 'Phase finale', shortLabel: 'Finale', path: '/finale' },
  { id: 'inscription', label: 'Inscription', shortLabel: 'Inscription', path: '/inscription' },
  { id: 'admin', label: 'Admin', shortLabel: 'Admin', path: '/admin', requiresAdmin: true },
];
