import Allocation from '../models/Allocation.js';
import TransferRequest from '../models/TransferRequest.js';
import Asset from '../models/Asset.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notifications.js';

export const getAllocations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.allocatedTo = req.query.userId;

    const allocations = await Allocation.find(filter)
      .populate('asset', 'name assetTag status condition')
      .populate('allocatedTo', 'name email')
      .populate('allocatedToDepartment', 'name')
      .populate('allocatedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(allocations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const allocateAsset = async (req, res) => {
  try {
    const { assetId, allocatedTo, allocatedToDepartment, expectedReturnDate } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    if (asset.status === 'allocated') {
      const active = await Allocation.findOne({ asset: assetId, status: { $in: ['active', 'overdue'] } })
        .populate('allocatedTo', 'name email');
      return res.status(409).json({
        message: 'Asset is already allocated',
        currentHolder: active?.allocatedTo,
        allocationId: active?._id,
      });
    }

    if (!['available', 'reserved'].includes(asset.status)) {
      return res.status(400).json({ message: `Cannot allocate asset with status: ${asset.status}` });
    }

    const allocation = await Allocation.create({
      asset: assetId,
      allocatedTo: allocatedTo || undefined,
      allocatedToDepartment: allocatedToDepartment || undefined,
      expectedReturnDate,
      allocatedBy: req.user._id,
    });

    asset.status = 'allocated';
    await asset.save();

    if (allocatedTo) {
      await createNotification(
        allocatedTo,
        'asset_assigned',
        `Asset ${asset.assetTag} (${asset.name}) has been assigned to you`,
        { entityType: 'Allocation', entityId: allocation._id }
      );
    }

    await logActivity(req.user._id, 'allocate_asset', 'Allocation', { assetTag: asset.assetTag });

    const populated = await Allocation.findById(allocation._id)
      .populate('asset', 'name assetTag')
      .populate('allocatedTo', 'name email')
      .populate('allocatedToDepartment', 'name');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const returnAsset = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id).populate('asset');
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    if (allocation.status === 'returned') {
      return res.status(400).json({ message: 'Already returned' });
    }

    allocation.status = 'returned';
    allocation.returnedAt = new Date();
    allocation.returnNotes = req.body.returnNotes;
    await allocation.save();

    const asset = await Asset.findById(allocation.asset._id);
    asset.status = 'available';
    if (req.body.condition) asset.condition = req.body.condition;
    await asset.save();

    await logActivity(req.user._id, 'return_asset', 'Allocation', { assetTag: asset.assetTag });
    res.json(allocation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const requestTransfer = async (req, res) => {
  try {
    const { allocationId, toUser, toDepartment, notes } = req.body;
    const allocation = await Allocation.findById(allocationId).populate('asset allocatedTo');
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });

    const transfer = await TransferRequest.create({
      allocation: allocationId,
      asset: allocation.asset._id,
      fromUser: allocation.allocatedTo?._id,
      toUser,
      toDepartment,
      requestedBy: req.user._id,
      notes,
    });

    allocation.status = 'transfer_pending';
    await allocation.save();

    await logActivity(req.user._id, 'request_transfer', 'TransferRequest', { assetTag: allocation.asset.assetTag });
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
      .populate('fromUser', 'name')
      .populate('toUser', 'name')
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
    const transfer = await TransferRequest.findById(req.params.id).populate('allocation asset');
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

    if (req.body.action === 'reject') {
      transfer.status = 'rejected';
      transfer.approvedBy = req.user._id;
      await transfer.save();

      const allocation = await Allocation.findById(transfer.allocation._id);
      allocation.status = allocation.expectedReturnDate && new Date(allocation.expectedReturnDate) < new Date()
        ? 'overdue' : 'active';
      await allocation.save();
      return res.json(transfer);
    }

    transfer.status = 'approved';
    transfer.approvedBy = req.user._id;
    await transfer.save();

    const allocation = await Allocation.findById(transfer.allocation._id);
    allocation.allocatedTo = transfer.toUser || allocation.allocatedTo;
    allocation.allocatedToDepartment = transfer.toDepartment || allocation.allocatedToDepartment;
    allocation.status = 'active';
    await allocation.save();

    if (transfer.toUser) {
      await createNotification(
        transfer.toUser,
        'transfer_approved',
        `Transfer approved for asset ${transfer.asset.assetTag}`,
        { entityType: 'TransferRequest', entityId: transfer._id }
      );
    }

    await logActivity(req.user._id, 'approve_transfer', 'TransferRequest', { id: transfer._id });
    res.json(transfer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const flagOverdueAllocations = async () => {
  const overdue = await Allocation.find({
    status: 'active',
    expectedReturnDate: { $lt: new Date() },
  }).populate('allocatedTo asset');

  for (const alloc of overdue) {
    alloc.status = 'overdue';
    await alloc.save();
    if (alloc.allocatedTo) {
      await createNotification(
        alloc.allocatedTo._id,
        'overdue_return',
        `Overdue return: ${alloc.asset.assetTag} (${alloc.asset.name})`,
        { entityType: 'Allocation', entityId: alloc._id }
      );
    }
  }
};
