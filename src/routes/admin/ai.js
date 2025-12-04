const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/aiController');
router.post('/toggle', ctrl.toggle);
router.get('/low-attendance', ctrl.lowAttendance);
router.get('/at-risk', ctrl.atRisk);
router.get('/summary', ctrl.summary);
module.exports = router;
