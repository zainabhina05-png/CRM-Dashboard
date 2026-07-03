import { STATUS_COLORS, STATUS_ICONS } from '../constants';

const AnalyticsCard = ({ status, count, total }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = STATUS_COLORS[status];

  return (
    <div className="analytics-card glass-card" style={{ '--card-color': color }}>
      <div className="analytics-card__icon">{STATUS_ICONS[status]}</div>
      <div className="analytics-card__body">
        <p className="analytics-card__label">{status}</p>
        <h2 className="analytics-card__count">{count}</h2>
        <div className="analytics-card__bar-track">
          <div
            className="analytics-card__bar-fill"
            style={{ width: `${percentage}%`, background: color }}
          />
        </div>
        <p className="analytics-card__pct">{percentage}% of total</p>
      </div>
    </div>
  );
};

export default AnalyticsCard;
