import { Router } from 'express';
import {
  getTransferRequests,
  requestTransfer,
  approveTransfer,
} from '../controllers/allocationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getTransferRequests);
router.post('/', requestTransfer);
router.post('/:id/approve', authorize('Admin', 'AssetManager', 'DepartmentHead'), approveTransfer);

export default router;
