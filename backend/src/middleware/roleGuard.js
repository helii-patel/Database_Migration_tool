const logger = require('../utils/logger');

const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Role access denied: User ${req.user.id} (${req.user.role}) tried to access route requiring ${allowedRoles}`);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }
    next();
  };
};

module.exports = { roleGuard };
