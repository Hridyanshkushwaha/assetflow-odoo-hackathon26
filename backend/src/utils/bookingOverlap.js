import Booking from '../models/Booking.js';

/** Boundary-safe: booking starting exactly when another ends is NOT an overlap */
export function bookingsOverlap(newStart, newEnd, existingStart, existingEnd) {
  return newStart < existingEnd && newEnd > existingStart;
}

export async function findOverlappingBooking(resourceId, start, end, excludeId = null) {
  const filter = {
    resource: resourceId,
    status: { $in: ['Upcoming', 'Ongoing'] },
  };
  if (excludeId) filter._id = { $ne: excludeId };

  const existing = await Booking.find(filter);
  return existing.find((b) => bookingsOverlap(start, end, b.startTime, b.endTime)) || null;
}
