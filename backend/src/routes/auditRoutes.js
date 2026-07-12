import { Router } from 'express';
import {
  getAuditCycles,
  getAuditCycle,
  createAuditCycle,
  verifyAuditItem,
  closeAuditCycle,
  getDiscrepancyReport,
} from '../controllers/auditController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getAuditCycles);
router.get('/:id/discrepancies', getDiscrepancyReport);
router.get('/:id', getAuditCycle);
router.post('/', authorize('Admin'), createAuditCycle);
router.put('/:id/items/:itemId', verifyAuditItem);
router.put('/:id/close', authorize('Admin', 'AssetManager'), closeAuditCycle);

export default router;
