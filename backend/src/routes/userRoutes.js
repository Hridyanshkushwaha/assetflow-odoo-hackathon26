import { Router } from 'express';
import { getUsers, updateUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', authorize('Admin', 'AssetManager', 'DepartmentHead'), getUsers);
router.put('/:id', authorize('Admin'), updateUser);

export default router;
