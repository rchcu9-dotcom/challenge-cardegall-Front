export interface TabConfig {
  id: string;
  label: string;
  shortLabel: string;
  path: string;
  /** Si `true`, le tab n'est affiché que si l'utilisateur connecté a le rôle `admin`. */
  requiresAdmin?: boolean;
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
