import { NavLink } from 'react-router-dom';
import { useVisibleTabs } from '../../hooks/useVisibleTabs';

type Props = {
  onNavigate: () => void;
};

export function HamburgerMenu({ onNavigate }: Props) {
  const visibleTabs = useVisibleTabs();

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
