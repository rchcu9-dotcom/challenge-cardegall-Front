import { NavLink } from 'react-router-dom';
import { useMenuTabs } from '../../hooks/useMenuTabs';

type Props = {
  variant: 'top' | 'bottom';
};

export function Tabs({ variant }: Props) {
  const { primaryTabs } = useMenuTabs();

  return (
    <nav className={`app-tabs app-tabs--${variant}`} aria-label="Navigation principale">
      {primaryTabs.map((tab) => (
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
