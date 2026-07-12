import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  getActivityLogs,
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/activity-logs', authorize('Admin', 'AssetManager'), getActivityLogs);
router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markNotificationRead);

export default router;
