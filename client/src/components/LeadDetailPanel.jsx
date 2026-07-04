import { useState, useCallback } from 'react';
import { ACTIVITY_TYPES } from '../constants';
import ActivityTimeline from './ActivityTimeline';
import RemindersPanel from './RemindersPanel';
import StatusBadge from './StatusBadge';
import { SOURCE_LABELS } from '../constants';
import useRole from '../hooks/useRole';

const ActivityForm = ({ onSubmit, loading }) => {
  const [type, setType] = useState('note');
  const [content, setContent] = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onSubmit({ type, content: content.trim() });
    setContent('');
  }, [type, content, onSubmit]);

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      <div className="activity-form__types" role="group" aria-label="Activity type">
        {ACTIVITY_TYPES.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            className={`activity-form__type ${type === value ? 'activity-form__type--active' : ''}`}
            onClick={() => setType(value)}
            aria-pressed={type === value}
          >
            {icon} {label}
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Log a ${type}…`}
        rows={2}
        maxLength={1000}
        aria-label="Activity content"
      />
      <button type="submit" className="btn btn--primary btn--sm" disabled={loading || !content.trim()}>
        {loading ? 'Saving…' : 'Log Activity'}
      </button>
    </form>
  );
};

const LeadDetailPanel = ({
  lead,
  loading,
  onClose,
  onEdit,
  onLogActivity,
  onStatusChange,
}) => {
  const { can } = useRole();
  if (!lead && !loading) return null;

  return (
    <div className="detail-panel-overlay" onClick={onClose} role="presentation">
      <aside
        className="detail-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-panel-title"
      >
        {loading && !lead ? (
          <div className="detail-panel__loader">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="detail-panel__header">
              <div>
                <h2 id="detail-panel-title" className="detail-panel__title">{lead.name}</h2>
                <p className="detail-panel__subtitle">{lead.company || lead.email}</p>
              </div>
              <button className="modal__close" onClick={onClose} aria-label="Close panel">✕</button>
            </div>

            <div className="detail-panel__meta">
              <StatusBadge
                status={lead.status}
                leadId={lead._id}
                onChange={onStatusChange}
              />
              {lead.source && (
                <span className="detail-panel__source">
                  via {SOURCE_LABELS[lead.source] || lead.source}
                </span>
              )}
            </div>

            {lead.tags?.length > 0 && (
              <div className="detail-panel__tags">
                {lead.tags.map((tag) => (
                  <span key={tag} className="tag-chip tag-chip--readonly">{tag}</span>
                ))}
              </div>
            )}

            <div className="detail-panel__info">
              <div><span className="muted">Email</span> {lead.email}</div>
              {lead.phone && <div><span className="muted">Phone</span> {lead.phone}</div>}
              {lead.customFields?.length > 0 && lead.customFields.map((f) => (
                f.key && (
                  <div key={f.key}>
                    <span className="muted">{f.key}</span> {f.value}
                  </div>
                )
              ))}
            </div>

            {lead.notes && (
              <div className="detail-panel__notes">
                <h3 className="section-title">Notes</h3>
                <p className="detail-panel__notes-text">{lead.notes}</p>
              </div>
            )}

            <div className="detail-panel__actions">
              <button className="btn btn--ghost btn--sm" onClick={() => onEdit(lead)}>
                Edit Lead
              </button>
            </div>

            <section className="detail-panel__section">
              <h3 className="section-title">Activity Timeline</h3>
              <ActivityForm onSubmit={onLogActivity} loading={loading} />
              <ActivityTimeline activities={lead.activities} loading={loading} />
              <RemindersPanel leadId={lead._id} />
            </section>
          </>
        )}
      </aside>
    </div>
  );
};

export default LeadDetailPanel;
