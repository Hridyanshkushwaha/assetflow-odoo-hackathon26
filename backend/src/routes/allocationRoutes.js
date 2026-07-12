import { Router } from 'express';
import { getAllocations, allocateAsset, returnAsset } from '../controllers/allocationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getAllocations);
router.post('/', authorize('Admin', 'AssetManager', 'DepartmentHead'), allocateAsset);
router.post('/:id/return', authorize('Admin', 'AssetManager'), returnAsset);

export default router;
