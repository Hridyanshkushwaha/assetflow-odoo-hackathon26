import Notification from '../models/Notification.js';

export async function createNotification(userId, type, message) {
  try {
    await Notification.create({ user: userId, type, message, isRead: false });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}
