import Allocation from '../models/Allocation.js';
import TransferRequest from '../models/TransferRequest.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notifications.js';

const populateAllocatedTo = async (allocation) => {
  const doc = allocation.toObject ? allocation.toObject() : allocation;
  if (doc.allocatedToType === 'User') {
    doc.holder = await User.findById(doc.allocatedTo).select('name email');
  }
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

    if (asset.status === 'Allocated') {
      const active = await Allocation.findOne({
        asset: assetId,
        status: { $in: ['Active', 'Overdue'] },
      });
      let holder = null;
      if (active?.allocatedToType === 'User') {
        holder = await User.findById(active.allocatedTo).select('name email');
      }
      return res.status(409).json({
        message: 'Asset is already allocated',
        currentHolder: holder,
        allocationId: active?._id,
      });
    }

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
    const { allocationId, toHolder, notes } = req.body;
    const allocation = await Allocation.findById(allocationId).populate('asset');
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });

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

    if (req.body.action === 'reject') {
      transfer.status = 'Rejected';
      transfer.approvedBy = req.user._id;
      await transfer.save();
      return res.json(transfer);
    }

    transfer.status = 'Approved';
    transfer.approvedBy = req.user._id;
    await transfer.save();

    const allocation = await Allocation.findOne({
      asset: transfer.asset._id,
      status: { $in: ['Active', 'Overdue'] },
    });
    if (allocation) {
      allocation.allocatedTo = transfer.toHolder;
      allocation.allocatedToType = 'User';
      allocation.status = 'Active';
      await allocation.save();
    }

    await createNotification(
      transfer.toHolder,
      'transfer_approved',
      `Transfer approved for asset ${transfer.asset.assetTag}`
    );

    await logActivity(req.user._id, 'approve_transfer', 'TransferRequest', transfer._id);
    res.json(transfer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const flagOverdueAllocations = async () => {
  const overdue = await Allocation.find({
    status: 'Active',
    expectedReturnDate: { $lt: new Date() },
  }).populate('asset');

  for (const alloc of overdue) {
    alloc.status = 'Overdue';
    await alloc.save();
    if (alloc.allocatedToType === 'User') {
      await createNotification(
        alloc.allocatedTo,
        'overdue_return',
        `Overdue return: ${alloc.asset.assetTag} (${alloc.asset.name})`
      );
    }
  }
};
