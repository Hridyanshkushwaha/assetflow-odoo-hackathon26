import { Router } from 'express';
import {
  getAllocations,
  allocateAsset,
  returnAsset,
  requestTransfer,
  getTransferRequests,
  approveTransfer,
} from '../controllers/allocationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getAllocations);
router.post('/', authorize('Admin', 'AssetManager', 'DepartmentHead'), allocateAsset);
router.put('/:id/return', authorize('Admin', 'AssetManager'), returnAsset);
router.post('/transfer', requestTransfer);
router.get('/transfers/all', getTransferRequests);
router.put('/transfers/:id', authorize('Admin', 'AssetManager', 'DepartmentHead'), approveTransfer);

export default router;
