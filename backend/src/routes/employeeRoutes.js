import { Router } from 'express';
import { getEmployees, updateEmployee, promoteEmployee } from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', authorize('Admin', 'AssetManager', 'DepartmentHead'), getEmployees);
router.put('/:id', authorize('Admin'), updateEmployee);
router.put('/:id/promote', authorize('Admin'), promoteEmployee);

export default router;
