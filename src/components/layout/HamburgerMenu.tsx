import { NavLink } from 'react-router-dom';
import { tabsConfig } from './tabsConfig';
import { useAuth } from '../../auth/AuthContext';
import { useEnrolementEtat } from '../../hooks/useEnrolementEtat';

type Props = {
  onNavigate: () => void;
};

export function HamburgerMenu({ onNavigate }: Props) {
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
    <div className="app-hamburger-menu" role="menu" aria-label="Menu de navigation">
      {visibleTabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.path}
          end={tab.path === '/'}
          role="menuitem"
          className={({ isActive }) => `app-hamburger-menu__link${isActive ? ' is-active' : ''}`}
          onClick={onNavigate}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
