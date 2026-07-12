import Notification from '../models/Notification.js';

export async function createNotification(userId, type, message, relatedEntity = {}) {
  try {
    await Notification.create({ user: userId, type, message, relatedEntity });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}
