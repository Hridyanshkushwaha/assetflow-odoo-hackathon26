import Department from '../models/Department.js';
import { logActivity } from '../utils/activityLogger.js';

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('head', 'name email')
      .populate('parentDepartment', 'name code')
      .sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body);
    await logActivity(req.user._id, 'create_department', 'Department', department._id);
    const populated = await Department.findById(department._id)
      .populate('head', 'name email')
      .populate('parentDepartment', 'name code');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('head', 'name email')
      .populate('parentDepartment', 'name code');

    if (!department) return res.status(404).json({ message: 'Department not found' });
    await logActivity(req.user._id, 'update_department', 'Department', department._id);
    res.json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
