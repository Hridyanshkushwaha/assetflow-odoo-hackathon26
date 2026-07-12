import AuditCycle from '../models/AuditCycle.js';
import AuditItem from '../models/AuditItem.js';
import Asset from '../models/Asset.js';
import Allocation from '../models/Allocation.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notifications.js';

export const getAuditCycles = async (req, res) => {
  try {
    const cycles = await AuditCycle.find()
      .populate('auditors', 'name email')
      .populate('scopeDepartment', 'name code')
      .sort({ createdAt: -1 });

    const withCounts = await Promise.all(
      cycles.map(async (cycle) => {
        const itemCount = await AuditItem.countDocuments({ auditCycle: cycle._id });
        return { ...cycle.toObject(), itemCount };
      })
    );

    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAuditCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id)
      .populate('auditors', 'name email')
      .populate('scopeDepartment', 'name code');

    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });

    const items = await AuditItem.find({ auditCycle: cycle._id }).populate(
      'asset',
      'name assetTag status location condition'
    );

    res.json({ ...cycle.toObject(), items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createAuditCycle = async (req, res) => {
  try {
    const { name, scopeDepartment, scopeLocation, startDate, endDate, auditors } = req.body;

    const assetFilter = { status: { $nin: ['Disposed'] } };
    if (scopeLocation) assetFilter.location = new RegExp(scopeLocation, 'i');

    let assets = await Asset.find(assetFilter);

    if (scopeDepartment) {
      const deptAllocations = await Allocation.find({
        allocatedTo: scopeDepartment,
        allocatedToType: 'Department',
        status: { $in: ['Active', 'Overdue'] },
      });
      const allocatedAssetIds = deptAllocations.map((a) => a.asset.toString());
      assets = assets.filter((a) => allocatedAssetIds.includes(a._id.toString()));
    }

    const cycle = await AuditCycle.create({
      name,
      scopeDepartment,
      scopeLocation,
      startDate,
      endDate,
      auditors,
      status: 'Open',
    });

    await AuditItem.insertMany(
      assets.map((a) => ({ auditCycle: cycle._id, asset: a._id, result: 'Verified' }))
    );

    await logActivity(req.user._id, 'create_audit_cycle', 'AuditCycle', cycle._id);
    res.status(201).json(cycle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyAuditItem = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle || cycle.status === 'Closed') {
      return res.status(400).json({ message: 'Audit cycle not available' });
    }

    const item = await AuditItem.findOneAndUpdate(
      { _id: req.params.itemId, auditCycle: cycle._id },
      { result: req.body.result, notes: req.body.notes },
      { new: true }
    ).populate('asset', 'name assetTag');

    if (!item) return res.status(404).json({ message: 'Audit item not found' });

    if (['Missing', 'Damaged'].includes(req.body.result) && cycle.auditors?.[0]) {
      await createNotification(
        cycle.auditors[0],
        'audit_discrepancy',
        `Audit discrepancy flagged: ${req.body.result} — ${item.asset?.assetTag}`
      );
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const closeAuditCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });
    if (cycle.status === 'Closed') return res.status(400).json({ message: 'Already closed' });

    const items = await AuditItem.find({ auditCycle: cycle._id });
    for (const item of items) {
      if (item.result === 'Missing') {
        await Asset.findByIdAndUpdate(item.asset, { status: 'Lost' });
      } else if (item.result === 'Damaged') {
        await Asset.findByIdAndUpdate(item.asset, { condition: 'Damaged' });
      }
    }

    cycle.status = 'Closed';
    await cycle.save();

    await logActivity(req.user._id, 'close_audit_cycle', 'AuditCycle', cycle._id);
    res.json(cycle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDiscrepancyReport = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });

    const discrepancies = await AuditItem.find({
      auditCycle: cycle._id,
      result: { $in: ['Missing', 'Damaged'] },
    }).populate('asset', 'name assetTag status location');

    res.json({ cycle: { name: cycle.name, status: cycle.status }, discrepancies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
