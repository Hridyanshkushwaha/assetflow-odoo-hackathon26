import User from '../models/User.js';
import { ROLES, PROMOTABLE_ROLES } from '../constants/businessRules.js';
import { logActivity } from '../utils/activityLogger.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .populate('department', 'name code')
      .sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Admin only — update department, status, or promote role */
export const updateUser = async (req, res) => {
  try {
    const { department, status, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (department !== undefined) user.department = department || null;
    if (status !== undefined) user.status = status;

    if (role !== undefined) {
      const allowed = [ROLES.EMPLOYEE, ...PROMOTABLE_ROLES];
      if (!allowed.includes(role)) {
        return res.status(400).json({
          message: 'Can only assign Employee, DepartmentHead, or AssetManager',
        });
      }
      if (user.role === ROLES.ADMIN) {
        return res.status(400).json({ message: 'Cannot change Admin role' });
      }
      user.role = role;
    }

    await user.save();
    await logActivity(req.user._id, 'update_user', 'User', user._id);

    const updated = await User.findById(user._id).select('-passwordHash').populate('department', 'name code');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
