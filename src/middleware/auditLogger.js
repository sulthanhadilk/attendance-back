const { AuditLog } = require('../models');
/**
 * Audit Logger Middleware
 * Logs admin actions for compliance and tracking
 */
const auditLogger = (action, entityType) => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);
    // Override res.json to capture response
    res.json = function(data) {
      // Only log if successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log asynchronously (don't wait)
        setImmediate(async () => {
          try {
            const logData = {
              actorUserId: req.user?._id,
              actorRole: req.user?.role || 'unknown',
              action: action || req.method + ' ' + req.path,
              entityType: entityType || 'unknown',
              entityId: req.params?.id || req.body?._id || data?._id || data?.id,
              details: {
                method: req.method,
                path: req.path,
                params: req.params,
                query: req.query,
                body: sanitizeBody(req.body),
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('user-agent')
              }
            };
            await AuditLog.create(logData);
          } catch (error) {
            console.error('Audit logging failed:', error);
            // Don't throw - logging failure shouldn't break the request
          }
        });
      }
      // Call original json
      return originalJson(data);
    };
    next();
  };
};
/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body) {
  if (!body) return {};
  const sanitized = { ...body };
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken'];
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
}
/**
 * Quick audit log helper for manual logging
 */
const logAudit = async (userId, action, entityType, entityId, details = {}) => {
  try {
    await AuditLog.create({
      actorUserId: userId,
      actorRole: 'admin',
      action,
      entityType,
      entityId,
      details
    });
  } catch (error) {
    console.error('Manual audit log failed:', error);
  }
};
module.exports = {
  auditLogger,
  logAudit
};
