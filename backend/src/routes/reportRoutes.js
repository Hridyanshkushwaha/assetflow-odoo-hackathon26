import { Router } from 'express';
import { getReports } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', authorize('Admin', 'AssetManager', 'DepartmentHead'), getReports);

export default router;
