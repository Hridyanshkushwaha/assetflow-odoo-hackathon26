import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Asset from '../models/Asset.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notifications.js';

export const getMaintenanceRequests = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const requests = await MaintenanceRequest.find(filter)
      .populate('asset', 'name assetTag status')
      .populate('raisedBy', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createMaintenanceRequest = async (req, res) => {
  try {
    const photo = req.file ? `/uploads/${req.file.filename}` : undefined;
    const request = await MaintenanceRequest.create({
      asset: req.body.assetId,
      raisedBy: req.user._id,
      issueDescription: req.body.issueDescription,
      priority: req.body.priority || 'Medium',
      photo,
      status: 'Pending',
    });

    await logActivity(req.user._id, 'raise_maintenance', 'MaintenanceRequest', request._id);
    const populated = await MaintenanceRequest.findById(request._id)
      .populate('asset', 'name assetTag')
      .populate('raisedBy', 'name');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateMaintenanceStatus = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id).populate('asset raisedBy');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const { status, technicianName, resolutionNotes } = req.body;
    request.status = status;
    request.approvedBy = req.user._id;
    if (technicianName) request.technicianName = technicianName;
    if (resolutionNotes) request.resolutionNotes = resolutionNotes;

    const asset = await Asset.findById(request.asset._id);

    if (status === 'Approved') {
      asset.status = 'UnderMaintenance';
      await createNotification(
        request.raisedBy._id,
        'maintenance_approved',
        `Maintenance approved for ${asset.assetTag}`
      );
    } else if (status === 'Rejected') {
      await createNotification(
        request.raisedBy._id,
        'maintenance_rejected',
        `Maintenance rejected for ${asset.assetTag}`
      );
    } else if (status === 'Resolved') {
      asset.status = 'Available';
      await createNotification(
        request.raisedBy._id,
        'maintenance_resolved',
        `Maintenance resolved for ${asset.assetTag}`
      );
    }

    await asset.save();
    await request.save();
    await logActivity(req.user._id, 'update_maintenance', 'MaintenanceRequest', request._id);

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
