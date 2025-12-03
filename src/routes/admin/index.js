const express = require('express');
const router = express.Router();
const authAdmin = require('../../middleware/authAdmin');
const authCtrl = require('../../controllers/admin/authController');

// Auth
router.post('/auth/login', authCtrl.login);
router.use(authAdmin);
router.get('/auth/profile', authCtrl.profile);

// Placeholder sub-routers to implement
router.use('/users', require('./users'));
router.use('/academics', require('./academics'));
router.use('/attendance', require('./attendance'));
router.use('/prayer', require('./prayer'));
router.use('/fines', require('./fines'));
router.use('/fees', require('./fees'));
router.use('/results', require('./results'));
router.use('/notices', require('./notices'));
router.use('/library', require('./library'));
router.use('/ai', require('./ai'));
router.use('/audit', require('./audit'));

module.exports = router;
