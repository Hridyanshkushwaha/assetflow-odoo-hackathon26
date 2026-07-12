import Asset from '../models/Asset.js';
import Allocation from '../models/Allocation.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Booking from '../models/Booking.js';

export const getReports = async (req, res) => {
  try {
    const [byStatus, byCategory, byDepartment, maintenanceByCategory, idleAssets, bookingHeatmap] =
      await Promise.all([
        Asset.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Asset.aggregate([
          { $lookup: { from: 'assetcategories', localField: 'category', foreignField: '_id', as: 'cat' } },
          { $unwind: '$cat' },
          { $group: { _id: '$cat.name', count: { $sum: 1 } } },
        ]),
        Allocation.aggregate([
          { $match: { status: { $in: ['active', 'overdue'] } } },
          { $lookup: { from: 'departments', localField: 'allocatedToDepartment', foreignField: '_id', as: 'dept' } },
          { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
          { $group: { _id: '$dept.name', count: { $sum: 1 } } },
        ]),
        MaintenanceRequest.aggregate([
          { $lookup: { from: 'assets', localField: 'asset', foreignField: '_id', as: 'assetDoc' } },
          { $unwind: '$assetDoc' },
          { $lookup: { from: 'assetcategories', localField: 'assetDoc.category', foreignField: '_id', as: 'cat' } },
          { $unwind: '$cat' },
          { $group: { _id: '$cat.name', count: { $sum: 1 } } },
        ]),
        Asset.find({ status: 'available', updatedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } })
          .populate('category', 'name')
          .limit(20),
        Booking.aggregate([
          { $match: { status: { $ne: 'cancelled' } } },
          { $project: { hour: { $hour: '$startTime' } } },
          { $group: { _id: '$hour', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

    res.json({
      assetsByStatus: byStatus,
      assetsByCategory: byCategory,
      allocationsByDepartment: byDepartment,
      maintenanceByCategory,
      idleAssets,
      bookingHeatmap,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
