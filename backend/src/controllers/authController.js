import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ROLES } from '../constants/businessRules.js';
import { logActivity } from '../utils/activityLogger.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const signup = async (req, res) => {
  try {
    if ('role' in req.body) {
      return res.status(400).json({ message: 'Role cannot be set during signup' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? ROLES.ADMIN : ROLES.EMPLOYEE;
    const passwordHash = await User.hashPassword(password);

    const user = await User.create({ name, email, passwordHash, role });
    const token = signToken(user._id);

    await logActivity(user._id, 'signup', 'User', user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).populate('department', 'name code');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.status === 'Inactive') {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const token = signToken(user._id);
    await logActivity(user._id, 'login', 'User', user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  res.json({ user: req.user });
};
