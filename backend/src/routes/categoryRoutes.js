import { Router } from 'express';
import { getCategories, createCategory, updateCategory } from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getCategories);
router.post('/', authorize('admin'), createCategory);
router.put('/:id', authorize('admin'), updateCategory);

export default router;
