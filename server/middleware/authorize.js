/**
 * authorize(...roles) — role-based access control middleware.
 * Must be used AFTER protect (req.user must be set).
 *
 * Usage:
 *   router.delete('/:id', protect, authorize('admin', 'manager'), handler)
 *
 * Roles hierarchy (lowest to highest privilege):
 *   sales_rep < manager < admin
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
        data: null,
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to perform this action`,
        data: null,
      });
    }

    next();
  };
};

module.exports = authorize;
