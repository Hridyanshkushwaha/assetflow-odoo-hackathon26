import { Router } from 'express';
import { getBookings, createBooking, updateBooking, getAssetCalendar } from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getBookings);
router.get('/calendar/:assetId', getAssetCalendar);
router.post('/', createBooking);
router.put('/:id', updateBooking);

export default router;
