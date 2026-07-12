import Allocation from '../models/Allocation.js';
import Booking from '../models/Booking.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { createNotification } from './notifications.js';

async function resolveHolder(allocation) {
  if (allocation.allocatedToType === 'User') {
    return User.findById(allocation.allocatedTo).select('name email');
  }
  if (allocation.allocatedToType === 'Department') {
    return Department.findById(allocation.allocatedTo).select('name code');
  }
  return null;
}

export async function flagOverdueAllocations() {
  const overdue = await Allocation.find({
    status: 'Active',
    expectedReturnDate: { $lt: new Date() },
  }).populate('asset');

  for (const alloc of overdue) {
    alloc.status = 'Overdue';
    await alloc.save();
    if (alloc.allocatedToType === 'User') {
      await createNotification(
        alloc.allocatedTo,
        'overdue_return',
        `Overdue return: ${alloc.asset.assetTag} (${alloc.asset.name})`
      );
    }
  }
}

export async function flagOverdueBookings() {
  const now = new Date();
  const overdue = await Booking.find({
    status: 'Upcoming',
    startTime: { $lt: now },
  }).populate('bookedBy resource');

  for (const booking of overdue) {
    booking.status = 'Ongoing';
    await booking.save();
  }

  const missed = await Booking.find({
    status: { $in: ['Upcoming', 'Ongoing'] },
    endTime: { $lt: now },
  }).populate('bookedBy resource');

  for (const booking of missed) {
    booking.status = 'Completed';
    await booking.save();
    await createNotification(
      booking.bookedBy._id,
      'booking_overdue',
      `Booking ended for ${booking.resource?.name || 'resource'} — marked completed`
    );
  }
}

export async function flagOverdueMaintenance() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const stale = await MaintenanceRequest.find({
    status: 'Pending',
    createdAt: { $lt: cutoff },
  }).populate('raisedBy asset');

  for (const req of stale) {
    await createNotification(
      req.raisedBy._id,
      'maintenance_overdue',
      `Maintenance request pending over 7 days for ${req.asset?.assetTag}`
    );
  }
}

export async function runOverdueChecks() {
  await flagOverdueAllocations();
  await flagOverdueBookings();
  await flagOverdueMaintenance();
}

export { resolveHolder };
