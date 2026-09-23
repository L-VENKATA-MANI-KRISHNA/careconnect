const AuditLog = require('../models/AuditLog');

const logAction = async ({
  actor = null,
  action,
  entityType = 'SYSTEM',
  entityId = null,
  metadata = {},
  req = null,
}) => {
  try {
    let ipAddress = '127.0.0.1';
    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    }

    await AuditLog.create({
      actor: actor?._id || actor || null,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: String(ipAddress),
    });
  } catch (err) {
    console.error(`[Audit Log Failed] Action: ${action}, Error: ${err.message}`);
  }
};

module.exports = {
  logAction,
};
