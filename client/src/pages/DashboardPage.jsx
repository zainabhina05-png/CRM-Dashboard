import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useLeads from '../hooks/useLeads';
import AnalyticsCard from '../components/AnalyticsCard';
import { LEAD_STATUSES } from '../constants';

const DashboardPage = () => {
  const { user } = useAuth();
  const { analytics, loading, error, fetchAnalytics } = useLeads();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">
            {greeting()}, <span>{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="page__subtitle">Here's an overview of your lead pipeline</p>
        </div>
        <Link to="/leads" className="btn btn--primary" id="go-to-leads-btn">
          Manage Leads →
        </Link>
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          <span>{error}</span>
        </div>
      )}

      <section aria-label="Analytics summary">
        <div className="analytics-summary">
          <div className="analytics-total">
            <span className="analytics-total__number">{analytics.total}</span>
            <span className="analytics-total__label">Total Leads</span>
          </div>
        </div>

        {loading ? (
          <div className="analytics-grid">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="analytics-card analytics-card--skeleton" />
            ))}
          </div>
        ) : (
          <div className="analytics-grid">
            {LEAD_STATUSES.map((status) => (
              <AnalyticsCard
                key={status}
                status={status}
                count={analytics.counts[status] ?? 0}
                total={analytics.total}
              />
            ))}
          </div>
        )}
      </section>

      <section className="quick-actions" aria-label="Quick actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions__grid">
          <Link to="/leads" className="quick-action-card glass-card" id="view-all-leads-card">
            <span className="quick-action-card__icon">👥</span>
            <span>View All Leads</span>
          </Link>
          <Link to="/leads?new=true" className="quick-action-card glass-card" id="add-lead-card">
            <span className="quick-action-card__icon">➕</span>
            <span>Add New Lead</span>
          </Link>
          <Link to="/leads?status=Won" className="quick-action-card glass-card" id="won-leads-card">
            <span className="quick-action-card__icon">🏆</span>
            <span>Won Leads</span>
          </Link>
          <Link to="/leads?status=New" className="quick-action-card glass-card" id="new-leads-card">
            <span className="quick-action-card__icon">🌱</span>
            <span>New Leads</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
