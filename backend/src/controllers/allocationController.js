import Allocation from '../models/Allocation.js';
import TransferRequest from '../models/TransferRequest.js';
import Asset from '../models/Asset.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notifications.js';
import { rejectIfAlreadyAllocated, getActiveAllocation } from '../utils/allocationRules.js';
import { resolveHolder } from '../utils/overdueChecker.js';

const populateAllocatedTo = async (allocation) => {
  const doc = allocation.toObject ? allocation.toObject() : allocation;
  doc.holder = await resolveHolder(doc);
  return doc;
};

export const getAllocations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) {
      filter.allocatedTo = req.query.userId;
      filter.allocatedToType = 'User';
    }

    const allocations = await Allocation.find(filter)
      .populate('asset', 'name assetTag status condition')
      .populate('allocatedBy', 'name')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(allocations.map(populateAllocatedTo));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const allocateAsset = async (req, res) => {
  try {
    const { assetId, allocatedTo, allocatedToType = 'User', expectedReturnDate } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const conflict = await rejectIfAlreadyAllocated(res, assetId);
    if (conflict) return;

    if (!['Available', 'Reserved'].includes(asset.status)) {
      return res.status(400).json({ message: `Cannot allocate asset with status: ${asset.status}` });
    }

    const allocation = await Allocation.create({
      asset: assetId,
      allocatedTo,
      allocatedToType,
      expectedReturnDate,
      allocatedBy: req.user._id,
      status: 'Active',
    });

    asset.status = 'Allocated';
    await asset.save();

    if (allocatedToType === 'User') {
      await createNotification(
        allocatedTo,
        'asset_assigned',
        `Asset ${asset.assetTag} (${asset.name}) has been assigned to you`
      );
    }

    await logActivity(req.user._id, 'allocate_asset', 'Allocation', allocation._id);

    const populated = await Allocation.findById(allocation._id)
      .populate('asset', 'name assetTag')
      .populate('allocatedBy', 'name');

    res.status(201).json(await populateAllocatedTo(populated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const returnAsset = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id).populate('asset');
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    if (allocation.status === 'Returned') {
      return res.status(400).json({ message: 'Already returned' });
    }

    allocation.status = 'Returned';
    allocation.actualReturnDate = new Date();
    allocation.conditionCheckInNotes = req.body.conditionCheckInNotes;
    await allocation.save();

    const asset = await Asset.findById(allocation.asset._id);
    asset.status = 'Available';
    if (req.body.condition) asset.condition = req.body.condition;
    await asset.save();

    await logActivity(req.user._id, 'return_asset', 'Allocation', allocation._id);
    res.json(allocation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const requestTransfer = async (req, res) => {
  try {
    const { allocationId, toHolder } = req.body;
    if (!allocationId || !toHolder) {
      return res.status(400).json({ message: 'allocationId and toHolder are required' });
    }

    const allocation = await Allocation.findById(allocationId).populate('asset');
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    if (!['Active', 'Overdue'].includes(allocation.status)) {
      return res.status(400).json({ message: 'No active allocation to transfer' });
    }

    const pending = await TransferRequest.findOne({
      asset: allocation.asset._id,
      status: 'Requested',
    });
    if (pending) {
      return res.status(409).json({ message: 'A transfer request is already pending for this asset' });
    }

    const transfer = await TransferRequest.create({
      asset: allocation.asset._id,
      fromHolder: allocation.allocatedTo,
      toHolder,
      requestedBy: req.user._id,
      status: 'Requested',
    });

    await logActivity(req.user._id, 'request_transfer', 'TransferRequest', transfer._id);
    res.status(201).json(transfer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTransferRequests = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const transfers = await TransferRequest.find(filter)
      .populate('asset', 'name assetTag')
      .populate('fromHolder', 'name')
      .populate('toHolder', 'name')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const approveTransfer = async (req, res) => {
  try {
    const transfer = await TransferRequest.findById(req.params.id).populate('asset');
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    if (transfer.status !== 'Requested') {
      return res.status(400).json({ message: 'Transfer is not in Requested status' });
    }

    if (req.body.action === 'reject') {
      transfer.status = 'Rejected';
      transfer.approvedBy = req.user._id;
      await transfer.save();
      await logActivity(req.user._id, 'reject_transfer', 'TransferRequest', transfer._id);
      return res.json(transfer);
    }

    const oldAllocation = await getActiveAllocation(transfer.asset._id);
    if (!oldAllocation) {
      return res.status(400).json({ message: 'No active allocation found for this asset' });
    }

    oldAllocation.status = 'Returned';
    oldAllocation.actualReturnDate = new Date();
    oldAllocation.conditionCheckInNotes = 'Closed via approved transfer';
    await oldAllocation.save();

    const newAllocation = await Allocation.create({
      asset: transfer.asset._id,
      allocatedTo: transfer.toHolder,
      allocatedToType: 'User',
      allocatedBy: req.user._id,
      status: 'Active',
      expectedReturnDate: oldAllocation.expectedReturnDate,
    });

    await Asset.findByIdAndUpdate(transfer.asset._id, { status: 'Allocated' });

    transfer.status = 'Approved';
    transfer.approvedBy = req.user._id;
    await transfer.save();

    await createNotification(
      transfer.toHolder,
      'transfer_approved',
      `Transfer approved for asset ${transfer.asset.assetTag}`
    );

    await logActivity(req.user._id, 'approve_transfer', 'TransferRequest', transfer._id);
    res.json({ transfer, closedAllocation: oldAllocation, newAllocation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
