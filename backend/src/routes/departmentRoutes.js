import { Router } from 'express';
import { getDepartments, createDepartment, updateDepartment } from '../controllers/departmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getDepartments);
router.post('/', authorize('admin'), createDepartment);
router.put('/:id', authorize('admin'), updateDepartment);

export default router;
