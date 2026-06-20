import { NavLink } from 'react-router-dom';
import { useVisibleTabs } from '../../hooks/useVisibleTabs';

type Props = {
  variant: 'top' | 'bottom';
  /** Limite le nombre d'onglets rendus (utilisé par TopBar pour basculer le surplus en hamburger). */
  maxVisible?: number;
};

export function Tabs({ variant, maxVisible }: Props) {
  const visibleTabs = useVisibleTabs();
  const tabsToRender = maxVisible != null ? visibleTabs.slice(0, maxVisible) : visibleTabs;

  return (
    <nav className={`app-tabs app-tabs--${variant}`} aria-label="Navigation principale">
      {tabsToRender.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.path}
          end={tab.path === '/'}
          className={({ isActive }) => `app-tabs__link${isActive ? ' is-active' : ''}`}
        >
          {variant === 'bottom' ? tab.shortLabel : tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
