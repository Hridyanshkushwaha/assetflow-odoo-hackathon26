import User from '../models/User.js';
import { logActivity } from '../utils/activityLogger.js';

export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find()
      .select('-password')
      .populate('department', 'name')
      .sort({ name: 1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { department, role, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    if (department !== undefined) user.department = department || null;
    if (status !== undefined) user.status = status;

    if (role !== undefined) {
      const allowed = ['employee', 'department_head', 'asset_manager'];
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can assign roles' });
      }
      if (!allowed.includes(role) && role !== 'admin') {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = role;
    }

    await user.save();
    await logActivity(req.user._id, 'update_employee', 'User', { employeeId: user._id, role: user.role });

    const updated = await User.findById(user._id).select('-password').populate('department', 'name');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
