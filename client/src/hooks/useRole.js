import { useAuth } from '../context/AuthContext';

/**
 * Convenience hook for role-based UI decisions.
 *
 * Usage:
 *   const { role, isAdmin, isManager, can } = useRole();
 *   can('delete_lead')  // returns true for admin/manager
 */

// Permissions map — add more as needed
const PERMISSIONS = {
  // Lead management
  create_lead:   ['admin', 'manager', 'sales_rep'],
  edit_lead:     ['admin', 'manager', 'sales_rep'],
  delete_lead:   ['admin', 'manager'],
  export_leads:  ['admin', 'manager'],
  // User / settings management
  manage_users:  ['admin'],
  view_all_leads: ['admin', 'manager'],
};

const useRole = () => {
  const { user } = useAuth();
  const role = user?.role || null;

  const isAdmin    = role === 'admin';
  const isManager  = role === 'manager';
  const isSalesRep = role === 'sales_rep';

  /**
   * Check if the current user has a specific named permission.
   * Falls back to false when not authenticated.
   */
  const can = (permission) => {
    if (!role) return false;
    const allowed = PERMISSIONS[permission];
    if (!allowed) return false;
    return allowed.includes(role);
  };

  /**
   * Check if the current user has at least one of the supplied roles.
   */
  const hasRole = (...roles) => {
    if (!role) return false;
    return roles.includes(role);
  };

  return { role, isAdmin, isManager, isSalesRep, can, hasRole };
};

export default useRole;
