import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMenuTabs } from '../useMenuTabs';
import { useVisibleTabs } from '../useVisibleTabs';
import { useEnrolementEtat } from '../useEnrolementEtat';
import type { TabConfig } from '../../components/layout/tabsConfig';

vi.mock('../useVisibleTabs');
vi.mock('../useEnrolementEtat');

const ALL_TABS: TabConfig[] = [
  { id: 'accueil', label: 'Accueil', shortLabel: 'Accueil', path: '/' },
  { id: 'competition', label: 'Compétition', shortLabel: 'Compét.', path: '/competition' },
  { id: 'planning', label: 'Planning', shortLabel: 'Planning', path: '/planning' },
  { id: 'resultats', label: 'Résultats & classement', shortLabel: 'Résultats', path: '/resultats' },
  { id: 'inscription', label: 'Inscription', shortLabel: 'Inscription', path: '/inscription' },
  { id: 'admin', label: 'Admin', shortLabel: 'Admin', path: '/admin', requiresAdmin: true },
];

function mockState(tabs: TabConfig[], cloture: boolean) {
  vi.mocked(useVisibleTabs).mockReturnValue(tabs);
  vi.mocked(useEnrolementEtat).mockReturnValue({ cloture });
}

describe('useMenuTabs', () => {
  it('before clôture: primaryTabs = Accueil, Compétition, Inscription ; le reste en secondaryTabs', () => {
    mockState(ALL_TABS, false);

    const { result } = renderHook(() => useMenuTabs());

    expect(result.current.allTabs).toEqual(ALL_TABS);
    expect(result.current.primaryTabs.map((tab) => tab.id)).toEqual([
      'accueil',
      'competition',
      'inscription',
    ]);
    expect(result.current.secondaryTabs.map((tab) => tab.id)).toEqual([
      'planning',
      'resultats',
      'admin',
    ]);
  });

  it('after clôture: primaryTabs = Accueil, Planning, Résultats & classement ; le reste en secondaryTabs', () => {
    // Inscription a déjà disparu de allTabs : filtrage fait amont par useVisibleTabs (cf. prod).
    const tabsApresCloture = ALL_TABS.filter((tab) => tab.id !== 'inscription');
    mockState(tabsApresCloture, true);

    const { result } = renderHook(() => useMenuTabs());

    expect(result.current.primaryTabs.map((tab) => tab.id)).toEqual([
      'accueil',
      'planning',
      'resultats',
    ]);
    expect(result.current.secondaryTabs.map((tab) => tab.id)).toEqual([
      'competition',
      'admin',
    ]);
  });

  it("l'item Admin n'apparaît jamais dans primaryTabs, seulement dans secondaryTabs quand il est visible", () => {
    mockState(ALL_TABS, false);

    const { result } = renderHook(() => useMenuTabs());

    expect(result.current.primaryTabs.find((tab) => tab.id === 'admin')).toBeUndefined();
    expect(result.current.secondaryTabs.find((tab) => tab.id === 'admin')).toBeDefined();
  });

  it('ignore défensivement un id "primaire" absent des tabs visibles', () => {
    mockState([ALL_TABS[0]], true);

    const { result } = renderHook(() => useMenuTabs());

    expect(result.current.primaryTabs.map((tab) => tab.id)).toEqual(['accueil']);
    expect(result.current.secondaryTabs).toEqual([]);
  });
});
