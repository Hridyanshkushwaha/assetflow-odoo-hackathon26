import Asset from '../models/Asset.js';
import Allocation from '../models/Allocation.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import { generateAssetTag } from '../utils/generateAssetTag.js';
import { logActivity } from '../utils/activityLogger.js';

export const getAssets = async (req, res) => {
  try {
    const { search, category, status, location, isBookable } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
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
      .populate('category', 'name extraFields')
      .sort({ createdAt: -1 });

    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('category', 'name extraFields');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAssetHistory = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).select('name assetTag');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const [allocations, maintenance] = await Promise.all([
      Allocation.find({ asset: asset._id })
        .populate('allocatedBy', 'name')
        .sort({ createdAt: -1 }),
      MaintenanceRequest.find({ asset: asset._id })
        .populate('raisedBy', 'name')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 }),
    ]);

    res.json({ asset, allocations, maintenance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createAsset = async (req, res) => {
  try {
    const assetTag = await generateAssetTag();
    const photos = req.files?.map((f) => `/uploads/${f.filename}`) || [];

    const asset = await Asset.create({
      name: req.body.name,
      category: req.body.category,
      assetTag,
      serialNumber: req.body.serialNumber,
      acquisitionDate: req.body.acquisitionDate,
      acquisitionCost: req.body.acquisitionCost ? Number(req.body.acquisitionCost) : undefined,
      condition: req.body.condition,
      location: req.body.location,
      photos,
      isBookable: req.body.isBookable === 'true' || req.body.isBookable === true,
      status: 'Available',
    });

    await logActivity(req.user._id, 'register_asset', 'Asset', asset._id);

    const populated = await Asset.findById(asset._id).populate('category', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    await logActivity(req.user._id, 'update_asset', 'Asset', asset._id);
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBookableAssets = async (req, res) => {
  try {
    const assets = await Asset.find({
      isBookable: true,
      status: { $in: ['Available', 'Reserved'] },
    })
      .populate('category', 'name')
      .sort({ name: 1 });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
