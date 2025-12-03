const { User, Admin } = require('../../models');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.role !== 'admin' || !(await user.comparePassword(password))) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const admin = await Admin.findOne({ userId: user._id });
    res.json({ token, admin });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
};

exports.profile = async (req, res) => {
  try {
    const admin = await Admin.findOne({ userId: req.user._id });
    res.json({ user: req.user, admin });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
};
