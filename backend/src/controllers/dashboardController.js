import Asset from '../models/Asset.js';
import Allocation from '../models/Allocation.js';
import Booking from '../models/Booking.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import TransferRequest from '../models/TransferRequest.js';
import { flagOverdueAllocations } from './allocationController.js';

export const getDashboard = async (req, res) => {
  try {
    await flagOverdueAllocations();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      assetsAvailable,
      assetsAllocated,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
      overdueReturns,
    ] = await Promise.all([
      Asset.countDocuments({ status: 'Available' }),
      Asset.countDocuments({ status: 'Allocated' }),
      MaintenanceRequest.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        status: { $ne: 'Resolved' },
      }),
      Booking.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] } }),
      TransferRequest.countDocuments({ status: 'Requested' }),
      Allocation.find({
        status: 'Active',
        expectedReturnDate: { $gte: today },
      })
        .populate('asset', 'name assetTag')
        .limit(10),
      Allocation.find({ status: 'Overdue' })
        .populate('asset', 'name assetTag')
        .limit(10),
    ]);

    const enrichAllocations = async (allocs) =>
      Promise.all(
        allocs.map(async (a) => {
          const obj = a.toObject();
          if (a.allocatedToType === 'User') {
            const User = (await import('../models/User.js')).default;
            obj.holder = await User.findById(a.allocatedTo).select('name');
          }
          return obj;
        })
      );

    res.json({
      kpis: {
        assetsAvailable,
        assetsAllocated,
        maintenanceToday,
        activeBookings,
        pendingTransfers,
        upcomingReturnsCount: upcomingReturns.length,
      },
      upcomingReturns: await enrichAllocations(upcomingReturns),
      overdueReturns: await enrichAllocations(overdueReturns),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
