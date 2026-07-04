import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — guards routes from unauthenticated access.
 *
 * Props:
 *   allowedRoles  string[]  (optional) — if provided, user must have one of these roles.
 *                           Defaults to any authenticated user.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['admin', 'manager']}>
 *     <AdminSettingsPage />
 *   </ProtectedRoute>
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  // Don't flash login before auth check completes
  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  // Role guard — show a 403-style message if the role doesn't match
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state__icon">🔒</div>
          <h3>Access Denied</h3>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
