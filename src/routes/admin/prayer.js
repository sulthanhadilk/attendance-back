const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/prayerController');
router.get('/summary', ctrl.summary);
router.put('/override', ctrl.override);
router.post('/reward', ctrl.setReward);
module.exports = router;
