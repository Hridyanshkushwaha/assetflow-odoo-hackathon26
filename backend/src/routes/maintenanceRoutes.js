import { Router } from 'express';
import {
  getMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceStatus,
} from '../controllers/maintenanceController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(protect);
router.get('/', getMaintenanceRequests);
router.post('/', upload.single('photo'), createMaintenanceRequest);
router.put('/:id/status', authorize('AssetManager'), updateMaintenanceStatus);

export default router;
