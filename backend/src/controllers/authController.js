const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models');
const logger = require('../utils/logger');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ success: false, message: 'Email already registered' });

    const allowedRole = ['admin', 'engineer', 'viewer'].includes(role) ? role : 'viewer';
    const user = await User.create({ username, email, password_hash: password, role: allowedRole });

    await AuditLog.create({ user_id: user.id, username: user.username, action: 'USER_REGISTERED', ip_address: req.ip, status: 'success' });
    const token = generateToken(user);
    res.status(201).json({ success: true, message: 'User registered successfully', data: { token, user: user.toSafeJSON() } });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !user.is_active) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    await user.update({ last_login: new Date() });
    await AuditLog.create({ user_id: user.id, username: user.username, action: 'USER_LOGIN', ip_address: req.ip, status: 'success' });

    const token = generateToken(user);
    res.json({ success: true, message: 'Login successful', data: { token, user: user.toSafeJSON() } });
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (username) user.username = username;
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      user.password_hash = newPassword;
    }
    await user.save();
    res.json({ success: true, message: 'Profile updated', data: user.toSafeJSON() });
  } catch (err) { next(err); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password_hash'] }, order: [['created_at', 'DESC']] });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, updateProfile, getAllUsers };
