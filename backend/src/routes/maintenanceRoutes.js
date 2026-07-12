import { Router } from 'express';
import {
  getMaintenanceRequests,
  createMaintenanceRequest,
  approveMaintenance,
  assignTechnician,
  startMaintenanceWork,
  resolveMaintenance,
} from '../controllers/maintenanceController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(protect);
router.get('/', getMaintenanceRequests);
router.post('/', upload.single('photo'), createMaintenanceRequest);
router.post('/:id/approve', authorize('AssetManager'), approveMaintenance);
router.post('/:id/assign-technician', authorize('AssetManager'), assignTechnician);
router.post('/:id/start', authorize('AssetManager'), startMaintenanceWork);
router.post('/:id/resolve', authorize('AssetManager'), resolveMaintenance);

export default router;
