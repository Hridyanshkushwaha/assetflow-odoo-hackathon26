import AssetCategory from '../models/AssetCategory.js';
import { logActivity } from '../utils/activityLogger.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await AssetCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await AssetCategory.create(req.body);
    await logActivity(req.user._id, 'create_category', 'AssetCategory', category._id);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await AssetCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await logActivity(req.user._id, 'update_category', 'AssetCategory', category._id);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
