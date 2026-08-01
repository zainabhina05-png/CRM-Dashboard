import { motion } from 'framer-motion';
import { pageVariants } from '../styles/motion';

/**
 * EmptyState — consistent empty/error/loading placeholder.
 *
 * Props:
 *   icon       string   — emoji icon
 *   title      string   — main heading
 *   message    string   — supporting text
 *   action     ReactNode — optional CTA button/link
 *   variant    'empty' | 'error' | 'loading'
 */
const EmptyState = ({
  icon,
  title,
  message,
  action,
  variant = 'empty',
}) => {
  if (variant === 'loading') {
    return (
      <div className="empty-state" aria-label="Loading content" aria-busy="true">
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>
          {message || 'Loading…'}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="empty-state"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      role={variant === 'error' ? 'alert' : undefined}
    >
      <div className="empty-state__icon" aria-hidden="true">
        {icon || (variant === 'error' ? '⚠️' : '📭')}
      </div>
      <h3>{title || (variant === 'error' ? 'Something went wrong' : 'Nothing here yet')}</h3>
      {message && <p>{message}</p>}
      {action && (
        <div style={{ marginTop: '1rem' }}>
          {action}
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState;
