import { Router } from 'express';
import {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  getBookableAssets,
} from '../controllers/assetController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(protect);
router.get('/', getAssets);
router.get('/bookable', getBookableAssets);
router.get('/:id', getAsset);
router.post(
  '/',
  authorize('admin', 'asset_manager'),
  upload.fields([{ name: 'photos', maxCount: 5 }, { name: 'documents', maxCount: 5 }]),
  createAsset
);
router.put('/:id', authorize('admin', 'asset_manager'), updateAsset);

export default router;
