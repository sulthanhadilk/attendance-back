const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/attendanceController');
router.get('/class', ctrl.viewClassAttendance);
router.put('/override', ctrl.overrideAttendance);
router.get('/download', ctrl.downloadReport);
router.post('/approve-error', ctrl.approveError);
module.exports = router;
