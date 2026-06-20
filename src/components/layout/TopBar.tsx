import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs } from './Tabs';
import { HamburgerMenu } from './HamburgerMenu';
import { useAuth } from '../../auth/AuthContext';

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  return (
    <header className="app-topbar">
      <button
        type="button"
        className="app-topbar__hamburger"
        aria-label="Ouvrir le menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="app-topbar__brand">Challenge CardeGall</div>
      <Tabs variant="top" />
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
