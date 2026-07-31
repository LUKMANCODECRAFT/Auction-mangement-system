/**
 * Role-Based Access Control (RBAC) Middleware Guard
 * @param  {...String} allowedRoles - Permitted roles (e.g., 'admin', 'seller', 'bidder')
 */
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Authentication required.' 
      });
    }

    // 2. Verify if user role matches permitted roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: User role '${req.user.role}' lacks sufficient privileges to access this resource.` 
      });
    }

    next();
  };
};