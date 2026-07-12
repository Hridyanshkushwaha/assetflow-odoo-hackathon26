import Asset from '../models/Asset.js';
import Allocation from '../models/Allocation.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Booking from '../models/Booking.js';

export const getUtilizationReport = async (req, res) => {
  try {
    const [byStatus, byCategory, idleAssets, utilizationByDepartment] = await Promise.all([
      Asset.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Asset.aggregate([
        { $lookup: { from: 'assetcategories', localField: 'category', foreignField: '_id', as: 'cat' } },
        { $unwind: '$cat' },
        { $group: { _id: '$cat.name', count: { $sum: 1 } } },
      ]),
      Asset.find({ status: 'Available', updatedAt: { $lt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) } })
        .populate('category', 'name')
        .limit(10),
      Allocation.aggregate([
        { $match: { status: { $in: ['Active', 'Overdue'] }, allocatedToType: 'User' } },
        { $lookup: { from: 'users', localField: 'allocatedTo', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $lookup: { from: 'departments', localField: 'user.department', foreignField: '_id', as: 'dept' } },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
        { $group: { _id: { $ifNull: ['$dept.name', 'Unassigned'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);
    res.json({ assetsByStatus: byStatus, assetsByCategory: byCategory, idleAssets, utilizationByDepartment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMaintenanceFrequencyReport = async (req, res) => {
  try {
    const [maintenanceByCategory, maintenanceTrend] = await Promise.all([
      MaintenanceRequest.aggregate([
        { $lookup: { from: 'assets', localField: 'asset', foreignField: '_id', as: 'assetDoc' } },
        { $unwind: '$assetDoc' },
        { $lookup: { from: 'assetcategories', localField: 'assetDoc.category', foreignField: '_id', as: 'cat' } },
        { $unwind: '$cat' },
        { $group: { _id: '$cat.name', count: { $sum: 1 } } },
      ]),
      MaintenanceRequest.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);
    res.json({ maintenanceByCategory, maintenanceTrend });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllocationSummaryReport = async (req, res) => {
  try {
    const allocationsByDepartment = await Allocation.aggregate([
      { $match: { status: { $in: ['Active', 'Overdue'] }, allocatedToType: 'Department' } },
      { $lookup: { from: 'departments', localField: 'allocatedTo', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$dept.name', count: { $sum: 1 } } },
    ]);
    res.json({ allocationsByDepartment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBookingHeatmapReport = async (req, res) => {
  try {
    const [bookingHeatmap, mostUsedAssets] = await Promise.all([
      Booking.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $project: { hour: { $hour: '$startTime' } } },
        { $group: { _id: '$hour', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: '$resource', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'assets', localField: '_id', foreignField: '_id', as: 'asset' } },
        { $unwind: '$asset' },
        { $project: { _id: '$asset.name', assetTag: '$asset.assetTag', count: 1 } },
      ]),
    ]);
    res.json({ bookingHeatmap, mostUsedAssets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMaintenanceAlertsReport = async (req, res) => {
  try {
    const [pendingMaintenance, agingAssets] = await Promise.all([
      MaintenanceRequest.find({ status: { $in: ['Pending', 'Approved', 'TechnicianAssigned', 'InProgress'] } })
        .populate('asset', 'name assetTag')
        .sort({ createdAt: 1 })
        .limit(10),
      Asset.find({
        acquisitionDate: { $lte: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000) },
        status: { $nin: ['Retired', 'Disposed'] },
      })
        .populate('category', 'name')
        .limit(10),
    ]);
    res.json({ pendingMaintenance, agingAssets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
