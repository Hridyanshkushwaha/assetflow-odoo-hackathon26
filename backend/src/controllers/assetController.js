import Asset from '../models/Asset.js';
import Allocation from '../models/Allocation.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import { generateAssetTag } from '../utils/generateAssetTag.js';
import { logActivity } from '../utils/activityLogger.js';

export const getAssets = async (req, res) => {
  try {
    const { search, category, status, department, location, isBookable } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (location) filter.location = new RegExp(location, 'i');
    if (isBookable !== undefined) filter.isBookable = isBookable === 'true';

    if (search) {
      filter.$or = [
        { assetTag: new RegExp(search, 'i') },
        { serialNumber: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
      ];
    }

    const assets = await Asset.find(filter)
      .populate('category', 'name')
      .populate('department', 'name')
      .populate('registeredBy', 'name')
      .sort({ createdAt: -1 });

    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('category', 'name customFields')
      .populate('department', 'name')
      .populate('registeredBy', 'name email');

    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const allocations = await Allocation.find({ asset: asset._id })
      .populate('allocatedTo', 'name email')
      .populate('allocatedToDepartment', 'name')
      .populate('allocatedBy', 'name')
      .sort({ createdAt: -1 });

    const maintenance = await MaintenanceRequest.find({ asset: asset._id })
      .populate('raisedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ asset, allocations, maintenance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createAsset = async (req, res) => {
  try {
    const assetTag = await generateAssetTag();
    const photos = req.files?.filter((f) => f.fieldname === 'photos').map((f) => `/uploads/${f.filename}`) || [];
    const documents = req.files?.filter((f) => f.fieldname === 'documents').map((f) => `/uploads/${f.filename}`) || [];

    const asset = await Asset.create({
      ...req.body,
      assetTag,
      photos,
      documents,
      registeredBy: req.user._id,
      acquisitionCost: req.body.acquisitionCost ? Number(req.body.acquisitionCost) : undefined,
      isBookable: req.body.isBookable === 'true' || req.body.isBookable === true,
    });

    await logActivity(req.user._id, 'register_asset', 'Asset', { assetTag: asset.assetTag });

    const populated = await Asset.findById(asset._id)
      .populate('category', 'name')
      .populate('department', 'name');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    Object.assign(asset, req.body);
    if (req.body.acquisitionCost) asset.acquisitionCost = Number(req.body.acquisitionCost);
    await asset.save();

    await logActivity(req.user._id, 'update_asset', 'Asset', { assetTag: asset.assetTag });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBookableAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ isBookable: true, status: { $in: ['available', 'reserved'] } })
      .populate('category', 'name')
      .sort({ name: 1 });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
