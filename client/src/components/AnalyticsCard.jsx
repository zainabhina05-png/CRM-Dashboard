import { memo } from 'react';
import { STATUS_COLORS, STATUS_ICONS } from '../constants';

const AnalyticsCard = memo(({ status, count, total }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = STATUS_COLORS[status];

  return (
    <div
      className="analytics-card glass-card"
      style={{ '--card-color': color }}
      role="region"
      aria-label={`${status}: ${count} leads`}
    >
      <div className="analytics-card__icon" aria-hidden="true">{STATUS_ICONS[status]}</div>
      <div className="analytics-card__body">
        <p className="analytics-card__label">{status}</p>
        <h2 className="analytics-card__count">{count.toLocaleString()}</h2>
        <div
          className="analytics-card__bar-track"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percentage}% of total leads`}
        >
          <div
            className="analytics-card__bar-fill"
            style={{
              width: `${percentage}%`,
              background: color,
              transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>
        <p className="analytics-card__pct">{percentage}% of total</p>
      </div>
    </div>
  );
});

export default AnalyticsCard;
