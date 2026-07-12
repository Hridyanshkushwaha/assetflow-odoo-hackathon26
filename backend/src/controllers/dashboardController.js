import Asset from '../models/Asset.js';
import Allocation from '../models/Allocation.js';
import Booking from '../models/Booking.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import TransferRequest from '../models/TransferRequest.js';
import User from '../models/User.js';
import { runOverdueChecks } from '../utils/overdueChecker.js';

export const getDashboard = async (req, res) => {
  try {
    await runOverdueChecks();

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
      recentAllocations,
      recentBookings,
      recentMaintenance,
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
      Allocation.find()
        .populate('asset', 'name assetTag')
        .sort({ createdAt: -1 })
        .limit(5),
      Booking.find({ status: { $ne: 'Cancelled' } })
        .populate('resource', 'name assetTag')
        .populate('bookedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      MaintenanceRequest.find({ status: 'Resolved' })
        .populate('asset', 'name assetTag')
        .sort({ updatedAt: -1 })
        .limit(5),
    ]);

    const enrichAllocations = async (allocs) =>
      Promise.all(
        allocs.map(async (a) => {
          const obj = a.toObject();
          if (a.allocatedToType === 'User') {
            const holder = await User.findById(a.allocatedTo).select('name department').populate('department', 'name');
            obj.holder = holder;
          }
          return obj;
        })
      );

    const enrichedRecentAllocations = await enrichAllocations(recentAllocations);

    const recentActivity = [
      ...enrichedRecentAllocations.map((a) => ({
        type: 'allocation',
        text: `${a.asset?.name} ${a.asset?.assetTag} — allocated to ${a.holder?.name}${a.holder?.department ? ` — ${a.holder.department.name} dept` : ''}`,
        timestamp: a.createdAt,
      })),
      ...recentBookings.map((b) => ({
        type: 'booking',
        text: `${b.resource?.name} — booking confirmed — ${new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        timestamp: b.createdAt,
      })),
      ...recentMaintenance.map((m) => ({
        type: 'maintenance',
        text: `${m.asset?.name} ${m.asset?.assetTag} — maintenance resolved`,
        timestamp: m.updatedAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6);

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
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
