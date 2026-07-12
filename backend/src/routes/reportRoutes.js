import { Router } from 'express';
import {
  getUtilizationReport,
  getMaintenanceFrequencyReport,
  getAllocationSummaryReport,
  getBookingHeatmapReport,
  getMaintenanceAlertsReport,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.use(authorize('Admin', 'AssetManager', 'DepartmentHead'));
router.get('/utilization', getUtilizationReport);
router.get('/maintenance-frequency', getMaintenanceFrequencyReport);
router.get('/allocation-summary', getAllocationSummaryReport);
router.get('/booking-heatmap', getBookingHeatmapReport);
router.get('/maintenance-alerts', getMaintenanceAlertsReport);

export default router;
