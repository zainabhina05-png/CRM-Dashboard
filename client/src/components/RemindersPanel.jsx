import { useState, useCallback } from 'react';
import useReminders from '../hooks/useReminders';
import { useToast } from '../context/ToastContext';

/* ── Due-date helpers ───────────────────────────────────── */
const formatDue = (dateStr) =>
  new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

const getDueStatus = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;
  if (diffMs < 0)              return 'overdue';
  if (diffMs < 24 * 3600_000)  return 'due-today';
  if (diffMs < 7  * 86400_000) return 'due-soon';
  return 'upcoming';
};

const DUE_COLORS = {
  overdue:   'var(--danger)',
  'due-today': 'var(--gold)',
  'due-soon':  'var(--teal)',
  upcoming:  'var(--text-3)',
};

const DUE_LABELS = {
  overdue:   'Overdue',
  'due-today': 'Due today',
  'due-soon':  'Due soon',
  upcoming:  null,
};

/* ── Minimal date-time local input value helper ─────────── */
const toDatetimeLocal = (d) => {
  // Returns "YYYY-MM-DDTHH:mm" for use in <input type="datetime-local">
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const defaultDue = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toDatetimeLocal(d);
};

/* ── Component ──────────────────────────────────────────── */
const RemindersPanel = ({ leadId }) => {
  const { toast } = useToast();
  const { reminders, loading, error, addReminder, markComplete, removeReminder } =
    useReminders(leadId);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', dueDate: defaultDue() });
  const [saving, setSaving] = useState(false);

  const handleAdd = useCallback(async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await addReminder({ title: form.title.trim(), dueDate: new Date(form.dueDate).toISOString() });
      setForm({ title: '', dueDate: defaultDue() });
      setShowForm(false);
      toast.success('Reminder set');
    } catch {
      toast.error('Failed to create reminder');
    } finally {
      setSaving(false);
    }
  }, [form, addReminder, toast]);

  const handleComplete = useCallback(async (id) => {
    await markComplete(id);
    toast.success('Reminder completed');
  }, [markComplete, toast]);

  const handleDelete = useCallback(async (id) => {
    await removeReminder(id);
    toast.info('Reminder removed');
  }, [removeReminder, toast]);

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h3 className="section-title" style={{ margin: 0 }}>
          Follow-up Reminders
          {reminders.length > 0 && (
            <span
              style={{
                marginLeft: '0.5rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--text-3)',
                background: 'var(--glass-3)',
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {reminders.length}
            </span>
          )}
        </h3>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          aria-label="Add reminder"
        >
          {showForm ? '✕ Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            padding: '0.75rem',
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            animation: 'fadeUp 0.15s ease both',
          }}
        >
          <div className="form-group" style={{ gap: '0.2rem' }}>
            <label htmlFor="reminder-title" style={{ fontSize: '0.7rem' }}>Task</label>
            <input
              id="reminder-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Send follow-up email"
              maxLength={100}
              autoFocus
              required
            />
          </div>
          <div className="form-group" style={{ gap: '0.2rem' }}>
            <label htmlFor="reminder-due" style={{ fontSize: '0.7rem' }}>Due date & time</label>
            <input
              id="reminder-due"
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={saving || !form.title.trim()}
          >
            {saving ? 'Saving…' : 'Set Reminder'}
          </button>
        </form>
      )}

      {error && (
        <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>{error}</p>
      )}

      {/* Reminder list */}
      {loading && !reminders.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{ height: 52, background: 'var(--glass-2)', borderRadius: 'var(--radius-sm)', animation: 'fadeIn 0.2s ease' }}
            />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', padding: '0.5rem 0' }}>
          No reminders set. Add one to schedule a follow-up.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {reminders.map((r) => {
            const dueStatus = getDueStatus(r.dueDate);
            const dueColor  = DUE_COLORS[dueStatus];
            const dueLabel  = DUE_LABELS[dueStatus];
            return (
              <li
                key={r._id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  padding: '0.6rem 0.75rem',
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  borderLeft: `3px solid ${dueColor}`,
                  borderRadius: 'var(--radius-sm)',
                  animation: 'fadeUp 0.15s ease both',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
                    {r.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    <time style={{ fontSize: '0.7rem', color: 'var(--text-3)' }} dateTime={r.dueDate}>
                      {formatDue(r.dueDate)}
                    </time>
                    {dueLabel && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: dueColor }}>
                        · {dueLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <button
                    className="btn btn--sm btn--ghost btn--icon"
                    onClick={() => handleComplete(r._id)}
                    aria-label="Mark reminder complete"
                    title="Mark complete"
                    style={{ color: 'var(--success)' }}
                  >
                    ✓
                  </button>
                  <button
                    className="btn btn--sm btn--danger-ghost btn--icon"
                    onClick={() => handleDelete(r._id)}
                    aria-label="Delete reminder"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RemindersPanel;
