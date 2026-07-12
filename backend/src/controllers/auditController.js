import AuditCycle from '../models/AuditCycle.js';
import Asset from '../models/Asset.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notifications.js';

export const getAuditCycles = async (req, res) => {
  try {
    const cycles = await AuditCycle.find()
      .populate('auditors', 'name email')
      .populate('scopeDepartment', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(cycles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAuditCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id)
      .populate('auditors', 'name email')
      .populate('items.asset', 'name assetTag status location condition')
      .populate('scopeDepartment', 'name');
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });
    res.json(cycle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createAuditCycle = async (req, res) => {
  try {
    const { name, scopeType, scopeDepartment, scopeLocation, startDate, endDate, auditors } = req.body;

    const assetFilter = { status: { $nin: ['disposed'] } };
    if (scopeType === 'department' && scopeDepartment) assetFilter.department = scopeDepartment;
    if (scopeType === 'location' && scopeLocation) assetFilter.location = new RegExp(scopeLocation, 'i');

    const assets = await Asset.find(assetFilter);
    const items = assets.map((a) => ({ asset: a._id }));

    const cycle = await AuditCycle.create({
      name,
      scopeType,
      scopeDepartment,
      scopeLocation,
      startDate,
      endDate,
      auditors,
      items,
      createdBy: req.user._id,
    });

    await logActivity(req.user._id, 'create_audit_cycle', 'AuditCycle', { name });
    res.status(201).json(cycle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyAuditItem = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle || cycle.status === 'closed') {
      return res.status(400).json({ message: 'Audit cycle not available' });
    }

    const item = cycle.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Audit item not found' });

    item.result = req.body.result;
    item.notes = req.body.notes;
    item.verifiedBy = req.user._id;
    item.verifiedAt = new Date();

    if (['missing', 'damaged'].includes(req.body.result)) {
      await createNotification(
        cycle.createdBy,
        'audit_discrepancy',
        `Audit discrepancy flagged: ${req.body.result}`,
        { entityType: 'AuditCycle', entityId: cycle._id }
      );
    }

    await cycle.save();
    res.json(cycle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const closeAuditCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });
    if (cycle.status === 'closed') return res.status(400).json({ message: 'Already closed' });

    for (const item of cycle.items) {
      if (item.result === 'missing') {
        await Asset.findByIdAndUpdate(item.asset, { status: 'lost' });
      } else if (item.result === 'damaged') {
        await Asset.findByIdAndUpdate(item.asset, { condition: 'damaged' });
      }
    }

    cycle.status = 'closed';
    cycle.closedAt = new Date();
    await cycle.save();

    await logActivity(req.user._id, 'close_audit_cycle', 'AuditCycle', { id: cycle._id });
    res.json(cycle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDiscrepancyReport = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id).populate('items.asset', 'name assetTag status location');
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });

    const discrepancies = cycle.items.filter((i) => ['missing', 'damaged'].includes(i.result));
    res.json({ cycle: { name: cycle.name, status: cycle.status }, discrepancies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
