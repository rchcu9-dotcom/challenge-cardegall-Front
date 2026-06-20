import { NavLink } from 'react-router-dom';
import { tabsConfig } from './tabsConfig';
import { useAuth } from '../../auth/AuthContext';
import { useEnrolementEtat } from '../../hooks/useEnrolementEtat';

type Props = {
  variant: 'top' | 'bottom';
};

export function Tabs({ variant }: Props) {
  const { user, loading } = useAuth();
  const { cloture } = useEnrolementEtat();

  const visibleTabs = tabsConfig.filter((tab) => {
    if (tab.requiresAdmin) {
      return !loading && user?.role === 'admin';
    }
    if (tab.id === 'inscription') {
      return !cloture;
    }
    return true;
  });

  return (
    <nav className={`app-tabs app-tabs--${variant}`} aria-label="Navigation principale">
      {visibleTabs.map((tab) => (
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
