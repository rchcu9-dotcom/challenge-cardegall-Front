import { getPrimaryTabIds, type TabConfig } from '../components/layout/tabsConfig';
import { useEnrolementEtat } from './useEnrolementEtat';
import { useVisibleTabs } from './useVisibleTabs';

export interface MenuTabs {
  /** Tous les items visibles pour l'utilisateur (filtrage rôle/clôture déjà appliqué). */
  allTabs: TabConfig[];
  /** Les 3 items mis en avant dans le bandeau, ordre déterminé par l'état de clôture. */
  primaryTabs: TabConfig[];
  /** Le reste des items visibles, accessible via le menu "Plus"/hamburger complet. */
  secondaryTabs: TabConfig[];
}

/**
 * Point de vérité unique pour répartir les items de navigation visibles entre
 * bandeau ("primaryTabs") et menu "Plus"/hamburger ("secondaryTabs"), partagé
 * par `Tabs` et `TopBar` pour éviter toute divergence entre les 3 rendus.
 */
export function useMenuTabs(): MenuTabs {
  const allTabs = useVisibleTabs();
  const { cloture } = useEnrolementEtat();
  const primaryIds = getPrimaryTabIds(cloture);

  const primaryTabs = primaryIds
    .map((id) => allTabs.find((tab) => tab.id === id))
    .filter((tab): tab is TabConfig => tab !== undefined);

  const secondaryTabs = allTabs.filter((tab) => !primaryIds.includes(tab.id));

  return { allTabs, primaryTabs, secondaryTabs };
}
