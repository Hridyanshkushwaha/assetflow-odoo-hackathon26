import { Router } from 'express';
import {
  getAssets,
  getAsset,
  getAssetHistory,
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
router.get('/:id/history', getAssetHistory);
router.get('/:id', getAsset);
router.post(
  '/',
  authorize('Admin', 'AssetManager'),
  upload.array('photos', 5),
  createAsset
);
router.put('/:id', authorize('Admin', 'AssetManager'), updateAsset);

export default router;
