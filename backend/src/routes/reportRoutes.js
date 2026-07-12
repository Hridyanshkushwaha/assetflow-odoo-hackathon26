import { Router } from 'express';
import { getReports } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', authorize('admin', 'asset_manager', 'department_head'), getReports);

export default router;
