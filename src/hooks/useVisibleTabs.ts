import { tabsConfig, type TabConfig } from '../components/layout/tabsConfig';
import { useAuth } from '../auth/AuthContext';
import { useEnrolementEtat } from './useEnrolementEtat';

/**
 * Filtre `tabsConfig` selon le rôle de l'utilisateur connecté et l'état de
 * clôture des enrôlements. Logique partagée entre `Tabs` et `HamburgerMenu`
 * pour garder le même menu visible quel que soit le mode d'affichage.
 */
export function useVisibleTabs(): TabConfig[] {
  const { user, loading } = useAuth();
  const { cloture } = useEnrolementEtat();

  return tabsConfig.filter((tab) => {
    if (tab.requiresAdmin) {
      return !loading && user?.role === 'admin';
    }
    if (tab.id === 'inscription') {
      return !cloture;
    }
    return true;
  });
}
