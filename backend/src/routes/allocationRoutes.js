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
router.post('/', authorize('admin', 'asset_manager', 'department_head'), allocateAsset);
router.put('/:id/return', authorize('admin', 'asset_manager'), returnAsset);
router.post('/transfer', requestTransfer);
router.get('/transfers/all', getTransferRequests);
router.put('/transfers/:id', authorize('admin', 'asset_manager', 'department_head'), approveTransfer);

export default router;
