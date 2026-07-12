import Allocation from '../models/Allocation.js';
import { ERROR_CODES } from '../constants/businessRules.js';
import { resolveHolder } from '../utils/overdueChecker.js';

export async function getActiveAllocation(assetId) {
  return Allocation.findOne({
    asset: assetId,
    status: { $in: ['Active', 'Overdue'] },
  });
}

export async function rejectIfAlreadyAllocated(res, assetId) {
  const active = await getActiveAllocation(assetId);
  if (!active) return null;

  const holder = await resolveHolder(active);
  res.status(409).json({
    code: ERROR_CODES.ALLOCATION_CONFLICT,
    message: `Asset is currently held by ${holder?.name || 'another party'}`,
    currentHolder: holder,
    allocationId: active._id,
    suggestTransfer: true,
  });
  return active;
}
