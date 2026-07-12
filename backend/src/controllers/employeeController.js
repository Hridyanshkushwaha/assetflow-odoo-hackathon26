import User from '../models/User.js';
import { ROLES, PROMOTABLE_ROLES } from '../constants/businessRules.js';
import { logActivity } from '../utils/activityLogger.js';

export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find()
      .select('-passwordHash')
      .populate('department', 'name code')
      .sort({ name: 1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Admin only — update department assignment and active status (not role) */
export const updateEmployee = async (req, res) => {
  try {
    if ('role' in req.body) {
      return res.status(400).json({
        message: 'Use PUT /employees/:id/promote to change roles',
      });
    }

    const { department, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    if (department !== undefined) user.department = department || null;
    if (status !== undefined) user.status = status;

    await user.save();
    await logActivity(req.user._id, 'update_employee', 'User', user._id);

    const updated = await User.findById(user._id).select('-passwordHash').populate('department', 'name code');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Admin only — promote/demote to DepartmentHead, AssetManager, or Employee */
export const promoteEmployee = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const allowed = [ROLES.EMPLOYEE, ...PROMOTABLE_ROLES];
    if (!allowed.includes(role)) {
      return res.status(400).json({
        message: 'Can only assign Employee, DepartmentHead, or AssetManager via this endpoint',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    if (user.role === ROLES.ADMIN) {
      return res.status(400).json({ message: 'Cannot change Admin role via promotion endpoint' });
    }

    user.role = role;
    await user.save();

    await logActivity(req.user._id, 'promote_employee', 'User', user._id);

    const updated = await User.findById(user._id).select('-passwordHash').populate('department', 'name code');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
