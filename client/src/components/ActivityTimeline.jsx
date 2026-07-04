import { ACTIVITY_ICONS } from '../constants';

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const ActivityTimeline = ({ activities = [], loading }) => {
  if (loading) {
    return (
      <div className="activity-timeline activity-timeline--loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="activity-timeline__skeleton" />
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="activity-timeline__empty">
        <p>No activities yet. Log a call, email, or note to get started.</p>
      </div>
    );
  }

  return (
    <div className="activity-timeline">
      {activities.map((activity) => (
        <div key={activity._id} className="activity-item">
          <div className="activity-item__icon" aria-hidden="true">
            {ACTIVITY_ICONS[activity.type] || '•'}
          </div>
          <div className="activity-item__body">
            <div className="activity-item__header">
              <span className="activity-item__type">
                {activity.type.replace('_', ' ')}
              </span>
              <time className="activity-item__time" dateTime={activity.createdAt}>
                {formatDate(activity.createdAt)}
              </time>
            </div>
            <p className="activity-item__content">{activity.content}</p>
            {activity.createdBy?.name && (
              <span className="activity-item__author">{activity.createdBy.name}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
