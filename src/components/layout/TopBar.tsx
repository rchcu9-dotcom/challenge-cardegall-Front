import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs } from './Tabs';
import { HamburgerMenu } from './HamburgerMenu';
import { useAuth } from '../../auth/AuthContext';
import { useMenuTabs } from '../../hooks/useMenuTabs';

type MenuMode = 'full' | 'overflow' | null;

export function TopBar() {
  const [menuMode, setMenuMode] = useState<MenuMode>(null);
  const { user, loading, logout } = useAuth();
  const { allTabs, secondaryTabs } = useMenuTabs();
  const hasOverflow = secondaryTabs.length > 0;

  function toggleFullMenu() {
    setMenuMode((mode) => (mode === 'full' ? null : 'full'));
  }

  function toggleOverflowMenu() {
    setMenuMode((mode) => (mode === 'overflow' ? null : 'overflow'));
  }

  return (
    <header className="app-topbar">
      <div className="app-topbar__hamburger-wrapper">
        <button
          type="button"
          className="app-topbar__hamburger"
          aria-label="Ouvrir le menu"
          aria-expanded={menuMode === 'full'}
          onClick={toggleFullMenu}
        >
          <span />
          <span />
          <span />
        </button>
        {menuMode === 'full' ? (
          <HamburgerMenu tabs={allTabs} onNavigate={() => setMenuMode(null)} />
        ) : null}
      </div>
      <div className="app-topbar__brand">Challenge CardeGall</div>
      <Tabs variant="top" />
      {hasOverflow ? (
        <div className="app-topbar__more-wrapper">
          <button
            type="button"
            className="app-topbar__more"
            aria-label="Plus d'options de navigation"
            aria-expanded={menuMode === 'overflow'}
            onClick={toggleOverflowMenu}
          >
            <span className="app-topbar__more-icon">
              <span />
              <span />
              <span />
            </span>
            <span className="app-topbar__more-label">Plus</span>
          </button>
          {menuMode === 'overflow' ? (
            <HamburgerMenu
              tabs={secondaryTabs}
              onNavigate={() => setMenuMode(null)}
              className="app-hamburger-menu--anchored"
            />
          ) : null}
        </div>
      ) : null}
      <div className="app-topbar__auth">
        {loading ? null : user ? (
          <>
            <span className="app-topbar__user">{user.displayName}</span>
            <button type="button" onClick={logout}>
              Déconnexion
            </button>
          </>
        ) : (
          <Link to="/login">Connexion</Link>
        )}
      </div>
    </header>
  );
}
