import { Router } from 'express';
import { getBookings, createBooking, updateBooking, getResourceCalendar } from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getBookings);
router.get('/calendar/:resourceId', getResourceCalendar);
router.post('/', createBooking);
router.put('/:id', updateBooking);

export default router;
