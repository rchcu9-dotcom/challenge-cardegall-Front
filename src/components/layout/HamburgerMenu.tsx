import { NavLink } from 'react-router-dom';
import type { TabConfig } from './tabsConfig';

type Props = {
  tabs: TabConfig[];
  onNavigate: () => void;
  className?: string;
};

export function HamburgerMenu({ tabs, onNavigate, className }: Props) {
  return (
    <div
      className={`app-hamburger-menu${className ? ` ${className}` : ''}`}
      role="menu"
      aria-label="Menu de navigation"
    >
      {tabs.map((tab) => (
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
