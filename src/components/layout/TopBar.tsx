import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs } from './Tabs';
import { HamburgerMenu } from './HamburgerMenu';
import { useAuth } from '../../auth/AuthContext';
import { useVisibleTabs } from '../../hooks/useVisibleTabs';

/** Au-delà de ce nombre d'onglets, le surplus n'est accessible que via le hamburger, même en desktop. */
const MAX_TOP_TABS = 3;

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const visibleTabs = useVisibleTabs();
  const hasOverflow = visibleTabs.length > MAX_TOP_TABS;

  return (
    <header className="app-topbar">
      <button
        type="button"
        className={`app-topbar__hamburger${hasOverflow ? ' app-topbar__hamburger--always' : ''}`}
        aria-label="Ouvrir le menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="app-topbar__brand">Challenge CardeGall</div>
      <Tabs variant="top" maxVisible={hasOverflow ? MAX_TOP_TABS : undefined} />
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
      {menuOpen ? <HamburgerMenu onNavigate={() => setMenuOpen(false)} /> : null}
    </header>
  );
}
