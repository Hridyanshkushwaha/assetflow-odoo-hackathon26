import ActivityLog from '../models/ActivityLog.js';

export async function logActivity(userId, action, entity, details = {}) {
  try {
    await ActivityLog.create({ user: userId, action, entity, details });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}
