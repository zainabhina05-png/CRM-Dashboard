import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { ROLE_LABELS } from '../constants';
import { getReminderSummary } from '../services/reminderService';

const ROLE_COLORS = {
  admin:     'var(--gold)',
  manager:   'var(--teal)',
  sales_rep: 'var(--text-3)',
};

const BELL_POLL_MS = 5 * 60 * 1000; // refresh bell count every 5 min

/* ── Notification bell ────────────────────────────────────── */
const NotificationBell = () => {
  const [summary, setSummary] = useState({ overdue: 0, dueToday: 0 });
  const [open, setOpen]       = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await getReminderSummary();
      setSummary({ overdue: res.data.overdue, dueToday: res.data.dueToday });
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, BELL_POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const urgentCount = summary.overdue + summary.dueToday;

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn--ghost btn--icon"
        aria-label={`Notifications${urgentCount ? ` — ${urgentCount} urgent` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ position: 'relative', fontSize: '1rem', padding: '0.35rem' }}
        id="notification-bell-btn"
      >
        🔔
        {urgentCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: summary.overdue > 0 ? 'var(--danger)' : 'var(--gold)',
              color: '#fff',
              fontSize: '0.55rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {urgentCount > 9 ? '9+' : urgentCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              width: 240,
              background: 'var(--bg-2)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 91,
              animation: 'fadeUp 0.15s ease both',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--glass-border)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                Reminders
              </p>
            </div>

            {urgentCount === 0 ? (
              <p style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-3)', margin: 0 }}>
                No urgent reminders 🎉
              </p>
            ) : (
              <div style={{ padding: '0.5rem 0' }}>
                {summary.overdue > 0 && (
                  <div style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                      {summary.overdue} overdue
                    </span>
                  </div>
                )}
                {summary.dueToday > 0 && (
                  <div style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>
                      {summary.dueToday} due today
                    </span>
                  </div>
                )}
                <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--glass-border)' }}>
                  <Link
                    to="/leads"
                    onClick={() => setOpen(false)}
                    style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 500 }}
                  >
                    View leads →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Navbar ───────────────────────────────────────────────── */
const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/pipeline',  label: 'Pipeline'  },
    { path: '/leads',     label: 'Leads'     },
    { path: '/analytics', label: 'Analytics' },
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
        <NotificationBell />

        <div className="navbar__avatar" aria-label={`Logged in as ${user?.name}`}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span className="navbar__username">{user?.name}</span>
          {user?.role && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: ROLE_COLORS[user.role] || 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
              aria-label={`Role: ${ROLE_LABELS[user.role] || user.role}`}
            >
              {ROLE_LABELS[user.role] || user.role}
            </span>
          )}
        </div>

        <button className="btn btn--ghost btn--sm" onClick={handleLogout} id="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
