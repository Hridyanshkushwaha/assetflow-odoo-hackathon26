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
      Asset.countDocuments({ status: 'available' }),
      Asset.countDocuments({ status: 'allocated' }),
      MaintenanceRequest.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        status: { $ne: 'resolved' },
      }),
      Booking.countDocuments({ status: { $in: ['upcoming', 'ongoing'] } }),
      TransferRequest.countDocuments({ status: 'requested' }),
      Allocation.find({
        status: 'active',
        expectedReturnDate: { $gte: today },
      })
        .populate('asset', 'name assetTag')
        .populate('allocatedTo', 'name')
        .limit(10),
      Allocation.find({ status: 'overdue' })
        .populate('asset', 'name assetTag')
        .populate('allocatedTo', 'name')
        .limit(10),
    ]);

    res.json({
      kpis: {
        assetsAvailable,
        assetsAllocated,
        maintenanceToday,
        activeBookings,
        pendingTransfers,
        upcomingReturnsCount: upcomingReturns.length,
      },
      upcomingReturns,
      overdueReturns,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
