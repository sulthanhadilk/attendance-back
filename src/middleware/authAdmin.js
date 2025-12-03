const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async function authAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ msg: 'No token provided' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });
    req.user = user;
    next();
  } catch (err) {
    console.error('authAdmin error:', err);
    return res.status(401).json({ msg: 'Invalid token' });
  }
}
