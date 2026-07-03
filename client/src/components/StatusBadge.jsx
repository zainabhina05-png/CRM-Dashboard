import { STATUS_COLORS, STATUS_ICONS, LEAD_STATUSES } from '../constants';

const StatusBadge = ({ status, onChange, leadId }) => {
  if (onChange) {
    return (
      <select
        className="status-select"
        value={status}
        style={{ '--status-color': STATUS_COLORS[status] }}
        onChange={(e) => onChange(leadId, e.target.value)}
        aria-label={`Change status for lead`}
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_ICONS[s]} {s}
          </option>
        ))}
      </select>
    );
  }

  return (
    <span
      className="status-badge"
      style={{ '--status-color': STATUS_COLORS[status] }}
    >
      {STATUS_ICONS[status]} {status}
    </span>
  );
};

export default StatusBadge;
