import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Asset from '../models/Asset.js';
import { ROLES, ERROR_CODES } from '../constants/businessRules.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notifications.js';

const VALID_TRANSITIONS = {
  Pending: ['Approved', 'Rejected'],
  Approved: ['TechnicianAssigned'],
  TechnicianAssigned: ['InProgress'],
  InProgress: ['Resolved'],
  Rejected: [],
  Resolved: [],
};

async function transitionMaintenance(request, status, req, extra = {}) {
  const allowedNext = VALID_TRANSITIONS[request.status] || [];
  if (!allowedNext.includes(status)) {
    const err = new Error(`Cannot transition from ${request.status} to ${status}`);
    err.code = ERROR_CODES.INVALID_STATUS_TRANSITION;
    err.allowedTransitions = allowedNext;
    throw err;
  }

  if (['Approved', 'Rejected'].includes(status) && req.user.role !== ROLES.ASSET_MANAGER) {
    const err = new Error('Only Asset Manager can approve or reject maintenance requests');
    err.statusCode = 403;
    throw err;
  }

  request.status = status;
  request.approvedBy = req.user._id;
  if (extra.technicianName) request.technicianName = extra.technicianName;
  if (extra.resolutionNotes) request.resolutionNotes = extra.resolutionNotes;

  const asset = await Asset.findById(request.asset._id || request.asset);

  if (status === 'Approved') {
    asset.status = 'UnderMaintenance';
    await createNotification(request.raisedBy._id, 'maintenance_approved', `Maintenance approved for ${asset.assetTag}`);
    await asset.save();
  } else if (status === 'Rejected') {
    await createNotification(request.raisedBy._id, 'maintenance_rejected', `Maintenance rejected for ${asset.assetTag}`);
  } else if (status === 'Resolved') {
    asset.status = 'Available';
    await createNotification(request.raisedBy._id, 'maintenance_resolved', `Maintenance resolved for ${asset.assetTag}`);
    await asset.save();
  }

  await request.save();
  await logActivity(req.user._id, 'update_maintenance', 'MaintenanceRequest', request._id);
  return request;
}

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

export const approveMaintenance = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id).populate('asset raisedBy');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const approved = req.body.approved !== false;
    const status = approved ? 'Approved' : 'Rejected';
    const updated = await transitionMaintenance(request, status, req);
    res.json(updated);
  } catch (err) {
    if (err.code === ERROR_CODES.INVALID_STATUS_TRANSITION) {
      return res.status(400).json({ code: err.code, message: err.message, allowedTransitions: err.allowedTransitions });
    }
    if (err.statusCode === 403) return res.status(403).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

export const assignTechnician = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id).populate('asset raisedBy');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const updated = await transitionMaintenance(request, 'TechnicianAssigned', req, {
      technicianName: req.body.technicianName || 'Tech Team',
    });
    res.json(updated);
  } catch (err) {
    if (err.code === ERROR_CODES.INVALID_STATUS_TRANSITION) {
      return res.status(400).json({ code: err.code, message: err.message, allowedTransitions: err.allowedTransitions });
    }
    res.status(500).json({ message: err.message });
  }
};

export const startMaintenanceWork = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id).populate('asset raisedBy');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const updated = await transitionMaintenance(request, 'InProgress', req);
    res.json(updated);
  } catch (err) {
    if (err.code === ERROR_CODES.INVALID_STATUS_TRANSITION) {
      return res.status(400).json({ code: err.code, message: err.message, allowedTransitions: err.allowedTransitions });
    }
    res.status(500).json({ message: err.message });
  }
};

export const resolveMaintenance = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id).populate('asset raisedBy');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const updated = await transitionMaintenance(request, 'Resolved', req, {
      resolutionNotes: req.body.resolutionNotes,
    });
    res.json(updated);
  } catch (err) {
    if (err.code === ERROR_CODES.INVALID_STATUS_TRANSITION) {
      return res.status(400).json({ code: err.code, message: err.message, allowedTransitions: err.allowedTransitions });
    }
    res.status(500).json({ message: err.message });
  }
};
