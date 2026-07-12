import Booking from '../models/Booking.js';
import Asset from '../models/Asset.js';
import { ERROR_CODES } from '../constants/businessRules.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notifications.js';
import { findOverlappingBooking } from '../utils/bookingOverlap.js';

export const getBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.resourceId) filter.resource = req.query.resourceId;
    if (req.query.userId) filter.bookedBy = req.query.userId;
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate('resource', 'name assetTag location')
      .populate('bookedBy', 'name email')
      .sort({ startTime: 1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { resourceId, startTime, endTime } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const asset = await Asset.findById(resourceId);
    if (!asset?.isBookable) {
      return res.status(400).json({ message: 'Resource is not bookable' });
    }

    const overlap = await findOverlappingBooking(resourceId, start, end);
    if (overlap) {
      return res.status(409).json({
        code: ERROR_CODES.BOOKING_OVERLAP,
        message: 'Booking overlaps with an existing reservation',
        conflictingBooking: { startTime: overlap.startTime, endTime: overlap.endTime },
      });
    }

    const booking = await Booking.create({
      resource: resourceId,
      bookedBy: req.user._id,
      startTime: start,
      endTime: end,
      status: 'Upcoming',
    });

    await createNotification(
      req.user._id,
      'booking_confirmed',
      `Booking confirmed for ${asset.name} (${start.toLocaleString()} - ${end.toLocaleString()})`
    );

    await logActivity(req.user._id, 'create_booking', 'Booking', booking._id);

    const populated = await Booking.findById(booking._id)
      .populate('resource', 'name assetTag')
      .populate('bookedBy', 'name');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = booking.bookedBy.toString() === req.user._id.toString();
    const isManager = ['Admin', 'AssetManager', 'DepartmentHead'].includes(req.user.role);
    if (!isOwner && !isManager) {
      return res.status(403).json({ message: 'Not authorized to modify this booking' });
    }

    if (req.body.status === 'Cancelled') {
      if (booking.status === 'Completed') {
        return res.status(400).json({ message: 'Cannot cancel a completed booking' });
      }
      booking.status = 'Cancelled';
      await booking.save();
      await createNotification(booking.bookedBy, 'booking_cancelled', 'Your booking has been cancelled');
      return res.json(booking);
    }

    if (req.body.startTime && req.body.endTime) {
      const start = new Date(req.body.startTime);
      const end = new Date(req.body.endTime);
      const overlap = await findOverlappingBooking(booking.resource, start, end, booking._id);
      if (overlap) {
        return res.status(409).json({
          code: ERROR_CODES.BOOKING_OVERLAP,
          message: 'Reschedule overlaps with existing booking',
        });
      }
      booking.startTime = start;
      booking.endTime = end;
    }

    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getResourceCalendar = async (req, res) => {
  try {
    const bookings = await Booking.find({
      resource: req.params.resourceId,
      status: { $ne: 'Cancelled' },
    })
      .populate('bookedBy', 'name')
      .sort({ startTime: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
