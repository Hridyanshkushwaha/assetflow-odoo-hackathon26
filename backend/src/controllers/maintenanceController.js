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
    const photos = req.files?.map((f) => `/uploads/${f.filename}`) || [];
    const request = await MaintenanceRequest.create({
      asset: req.body.assetId,
      raisedBy: req.user._id,
      description: req.body.description,
      priority: req.body.priority || 'medium',
      photos,
    });

    await logActivity(req.user._id, 'raise_maintenance', 'MaintenanceRequest', { assetId: req.body.assetId });
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

    const { status, rejectionReason, technician } = req.body;
    request.status = status;
    request.approvedBy = req.user._id;

    if (rejectionReason) request.rejectionReason = rejectionReason;
    if (technician) request.technician = technician;

    const asset = await Asset.findById(request.asset._id);

    if (status === 'approved') {
      asset.status = 'under_maintenance';
      await createNotification(
        request.raisedBy._id,
        'maintenance_approved',
        `Maintenance approved for ${asset.assetTag}`,
        { entityType: 'MaintenanceRequest', entityId: request._id }
      );
    } else if (status === 'rejected') {
      await createNotification(
        request.raisedBy._id,
        'maintenance_rejected',
        `Maintenance rejected for ${asset.assetTag}`,
        { entityType: 'MaintenanceRequest', entityId: request._id }
      );
    } else if (status === 'resolved') {
      request.resolvedAt = new Date();
      asset.status = 'available';
      await createNotification(
        request.raisedBy._id,
        'maintenance_resolved',
        `Maintenance resolved for ${asset.assetTag}`,
        { entityType: 'MaintenanceRequest', entityId: request._id }
      );
    }

    await asset.save();
    await request.save();
    await logActivity(req.user._id, 'update_maintenance', 'MaintenanceRequest', { status });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
