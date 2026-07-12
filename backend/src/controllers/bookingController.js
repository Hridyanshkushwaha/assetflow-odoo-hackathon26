import Booking from '../models/Booking.js';
import Asset from '../models/Asset.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notifications.js';

const hasOverlap = (start1, end1, start2, end2) => start1 < end2 && end1 > start2;

export const getBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.assetId) filter.asset = req.query.assetId;
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate('asset', 'name assetTag location')
      .populate('user', 'name email')
      .sort({ startTime: 1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { assetId, startTime, endTime, notes } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const asset = await Asset.findById(assetId);
    if (!asset?.isBookable) {
      return res.status(400).json({ message: 'Asset is not bookable' });
    }

    const existing = await Booking.find({
      asset: assetId,
      status: { $in: ['upcoming', 'ongoing'] },
    });

    for (const b of existing) {
      if (hasOverlap(start, end, b.startTime, b.endTime)) {
        return res.status(409).json({
          message: 'Booking overlaps with an existing reservation',
          conflictingBooking: { startTime: b.startTime, endTime: b.endTime },
        });
      }
    }

    const booking = await Booking.create({
      asset: assetId,
      user: req.user._id,
      startTime: start,
      endTime: end,
      notes,
    });

    await createNotification(
      req.user._id,
      'booking_confirmed',
      `Booking confirmed for ${asset.name} (${start.toLocaleString()} - ${end.toLocaleString()})`,
      { entityType: 'Booking', entityId: booking._id }
    );

    await logActivity(req.user._id, 'create_booking', 'Booking', { assetId });

    const populated = await Booking.findById(booking._id)
      .populate('asset', 'name assetTag')
      .populate('user', 'name');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (req.body.status === 'cancelled') {
      booking.status = 'cancelled';
      await booking.save();
      await createNotification(
        booking.user,
        'booking_cancelled',
        'Your booking has been cancelled',
        { entityType: 'Booking', entityId: booking._id }
      );
      return res.json(booking);
    }

    if (req.body.startTime && req.body.endTime) {
      const start = new Date(req.body.startTime);
      const end = new Date(req.body.endTime);
      const existing = await Booking.find({
        asset: booking.asset,
        status: { $in: ['upcoming', 'ongoing'] },
        _id: { $ne: booking._id },
      });

      for (const b of existing) {
        if (hasOverlap(start, end, b.startTime, b.endTime)) {
          return res.status(409).json({ message: 'Reschedule overlaps with existing booking' });
        }
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

export const getAssetCalendar = async (req, res) => {
  try {
    const bookings = await Booking.find({
      asset: req.params.assetId,
      status: { $ne: 'cancelled' },
    }).populate('user', 'name').sort({ startTime: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
