import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/leads', label: 'Leads' },
  ];

  return (
    <header className="navbar">
      <Link to="/dashboard" className="navbar__brand">
        <div className="navbar__logo-mark">⚡</div>
        <span className="navbar__title">LeadFlow</span>
      </Link>

      <nav className="navbar__links" aria-label="Main navigation">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="navbar__user">
        <div className="navbar__avatar" aria-label={`Logged in as ${user?.name}`}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <span className="navbar__username">{user?.name}</span>
        <button className="btn btn--ghost btn--sm" onClick={handleLogout} id="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
