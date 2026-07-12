import AuditCycle from '../models/AuditCycle.js';
import AuditItem from '../models/AuditItem.js';
import Asset from '../models/Asset.js';
import Allocation from '../models/Allocation.js';
import { ROLES, ERROR_CODES } from '../constants/businessRules.js';
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

    if (!auditors?.length) {
      return res.status(400).json({ message: 'At least one auditor must be assigned' });
    }

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
      assets.map((a) => ({ auditCycle: cycle._id, asset: a._id }))
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
    if (!cycle) return res.status(404).json({ message: 'Audit cycle not found' });

    if (cycle.status === 'Closed') {
      return res.status(400).json({
        code: ERROR_CODES.AUDIT_CYCLE_CLOSED,
        message: 'Audit cycle is closed — no further edits allowed',
      });
    }

    const isAuditor = cycle.auditors.some((a) => a.toString() === req.user._id.toString());
    if (!isAuditor && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ message: 'Only assigned auditors can submit audit results' });
    }

    const validResults = ['Verified', 'Missing', 'Damaged'];
    if (!validResults.includes(req.body.result)) {
      return res.status(400).json({ message: 'Invalid audit result' });
    }

    const item = await AuditItem.findOneAndUpdate(
      { _id: req.params.itemId, auditCycle: cycle._id },
      { result: req.body.result, notes: req.body.notes },
      { new: true }
    ).populate('asset', 'name assetTag');

    if (!item) return res.status(404).json({ message: 'Audit item not found' });

    if (['Missing', 'Damaged'].includes(req.body.result)) {
      for (const auditorId of cycle.auditors) {
        await createNotification(
          auditorId,
          'audit_discrepancy',
          `Discrepancy flagged: ${req.body.result} — ${item.asset?.assetTag}`
        );
      }
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
    if (cycle.status === 'Closed') {
      return res.status(400).json({
        code: ERROR_CODES.AUDIT_CYCLE_CLOSED,
        message: 'Audit cycle is already closed',
      });
    }

    const discrepancies = await AuditItem.find({
      auditCycle: cycle._id,
      result: { $in: ['Missing', 'Damaged'] },
    }).populate('asset', 'name assetTag status location');

    for (const item of discrepancies) {
      if (item.result === 'Missing') {
        await Asset.findByIdAndUpdate(item.asset._id, { status: 'Lost' });
      } else if (item.result === 'Damaged') {
        await Asset.findByIdAndUpdate(item.asset._id, { condition: 'Damaged' });
      }
    }

    cycle.status = 'Closed';
    await cycle.save();

    await logActivity(req.user._id, 'close_audit_cycle', 'AuditCycle', cycle._id);

    res.json({
      cycle,
      discrepancyReport: discrepancies,
      summary: {
        totalDiscrepancies: discrepancies.length,
        missing: discrepancies.filter((d) => d.result === 'Missing').length,
        damaged: discrepancies.filter((d) => d.result === 'Damaged').length,
      },
    });
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
