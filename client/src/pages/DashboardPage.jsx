import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import useLeads from '../hooks/useLeads';
import AnalyticsCard from '../components/AnalyticsCard';
import EmptyState from '../components/EmptyState';
import { LEAD_STATUSES } from '../constants';
import { pageVariants, statGrid, statCard } from '../styles/motion';

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
    <motion.div
      className="page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="page__header">
        <div>
          <h1 className="page__title">
            {greeting()}, <span>{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="page__subtitle">Here's an overview of your lead pipeline</p>
        </div>
        <Link to="/leads" className="btn btn--primary" id="go-to-leads-btn">
          Manage Leads →
        </Link>
      </div>

      {error && (
        <EmptyState
          variant="error"
          title="Failed to load analytics"
          message={error}
          action={
            <button className="btn btn--ghost btn--sm" onClick={fetchAnalytics}>
              Try again
            </button>
          }
        />
      )}

      {!error && (
      <section aria-label="Analytics summary">
        <div className="analytics-summary">
          <div className="analytics-total">
            <span className="analytics-total__number">{analytics.total}</span>
            <span className="analytics-total__label">Total Leads</span>
          </div>
        </div>

        {loading ? (
          <div className="analytics-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="analytics-card analytics-card--skeleton" aria-hidden="true" />
            ))}
          </div>
        ) : analytics.total === 0 ? (
          <EmptyState
            icon="📊"
            title="No leads yet"
            message="Add your first lead to start tracking your pipeline."
            action={
              <Link to="/leads?new=true" className="btn btn--primary">
                + Add your first lead
              </Link>
            }
          />
        ) : (
          <motion.div
            className="analytics-grid"
            variants={statGrid}
            initial="initial"
            animate="animate"
          >
            {LEAD_STATUSES.map((status) => (
              <motion.div key={status} variants={statCard}>
                <AnalyticsCard
                  status={status}
                  count={analytics.counts[status] ?? 0}
                  total={analytics.total}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
      )}

      <section className="quick-actions" aria-label="Quick actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions__grid">
          <Link to="/leads" className="quick-action-card glass-card" id="view-all-leads-card">
            <span className="quick-action-card__icon">≡</span>
            <span>View All Leads</span>
          </Link>
          <Link to="/pipeline" className="quick-action-card glass-card" id="pipeline-card">
            <span className="quick-action-card__icon">▦</span>
            <span>Pipeline Board</span>
          </Link>
          <Link to="/leads?new=true" className="quick-action-card glass-card" id="add-lead-card">
            <span className="quick-action-card__icon">+</span>
            <span>Add New Lead</span>
          </Link>
          <Link to="/leads?status=Won" className="quick-action-card glass-card" id="won-leads-card">
            <span className="quick-action-card__icon">★</span>
            <span>Won Leads</span>
          </Link>
          <Link to="/leads?status=New" className="quick-action-card glass-card" id="new-leads-card">
            <span className="quick-action-card__icon">●</span>
            <span>New Leads</span>
          </Link>
          <Link to="/analytics" className="quick-action-card glass-card" id="analytics-card">
            <span className="quick-action-card__icon">📊</span>
            <span>Analytics</span>
          </Link>
        </div>
      </section>
    </motion.div>
  );
};

export default DashboardPage;
