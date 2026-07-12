import { Router } from 'express';
import { getCategories, createCategory, updateCategory } from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getCategories);
router.post('/', authorize('Admin'), createCategory);
router.put('/:id', authorize('Admin'), updateCategory);

export default router;
