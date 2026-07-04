import { MATCH_REASON_LABELS } from '../constants';
import StatusBadge from './StatusBadge';

const DuplicateWarningModal = ({ duplicates, onConfirm, onCancel, loading }) => (
  <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="dup-title">
    <div className="modal">
      <div className="modal__header">
        <h2 id="dup-title">Potential Duplicates Found</h2>
      </div>
      <div className="modal__body">
        <p>We found existing leads that may match this record. Do you still want to create it?</p>
        <ul className="duplicate-list">
          {duplicates.map((dup) => (
            <li key={dup._id} className="duplicate-list__item glass-card">
              <div className="duplicate-list__info">
                <strong>{dup.name}</strong>
                <span className="muted">{dup.email}</span>
                {dup.company && <span className="muted">{dup.company}</span>}
              </div>
              <div className="duplicate-list__meta">
                <StatusBadge status={dup.status} />
                <span className="duplicate-list__reason">
                  {MATCH_REASON_LABELS[dup.matchReason] || 'Similar'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="modal__footer">
        <button className="btn btn--ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button className="btn btn--primary" onClick={onConfirm} disabled={loading}>
          {loading ? 'Creating…' : 'Create Anyway'}
        </button>
      </div>
    </div>
  </div>
);

export default DuplicateWarningModal;
