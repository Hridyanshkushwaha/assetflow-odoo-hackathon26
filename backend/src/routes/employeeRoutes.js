import { Router } from 'express';
import { getEmployees, updateEmployee } from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', authorize('admin', 'asset_manager', 'department_head'), getEmployees);
router.put('/:id', authorize('admin'), updateEmployee);

export default router;
