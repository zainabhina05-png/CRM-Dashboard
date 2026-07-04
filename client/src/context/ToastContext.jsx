import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let _idCounter = 0;

/**
 * ToastProvider — mounts a portal-less toast stack in the bottom-right corner.
 * Uses existing CSS variables — no new colors introduced.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.success('Lead created');
 *   toast.error('Something went wrong');
 *   toast.info('Reminder due in 10 min');
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_idCounter;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]); // max 5 toasts
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = {
    success: (msg, dur) => show(msg, 'success', dur),
    error:   (msg, dur) => show(msg, 'error',   dur),
    info:    (msg, dur) => show(msg, 'info',     dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

/* ── Toast stack UI ─────────────────────────────────────── */
const TOAST_STYLES = {
  success: { borderColor: 'var(--success)',  icon: '✓' },
  error:   { borderColor: 'var(--danger)',   icon: '✕' },
  info:    { borderColor: 'var(--teal)',     icon: 'ℹ' },
};

const ToastStack = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '340px',
        width: '100%',
      }}
    >
      {toasts.map((t) => {
        const { borderColor, icon } = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        return (
          <div
            key={t.id}
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.65rem 0.9rem',
              background: 'var(--bg-3)',
              border: '1px solid var(--glass-border)',
              borderLeft: `3px solid ${borderColor}`,
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              fontSize: '0.8125rem',
              color: 'var(--text)',
              animation: 'fadeUp 0.2s ease both',
            }}
          >
            <span style={{ color: borderColor, fontWeight: 700, flexShrink: 0, fontSize: '0.875rem' }}>
              {icon}
            </span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-3)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0.1rem 0.2rem',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export default ToastContext;
