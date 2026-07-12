import ActivityLog from '../models/ActivityLog.js';

export async function logActivity(userId, action, entityType, entityId = null) {
  try {
    await ActivityLog.create({ user: userId, action, entityType, entityId, timestamp: new Date() });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}
