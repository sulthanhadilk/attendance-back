const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/resultsController');

router.get('/', ctrl.list);
router.put('/:id/approve', ctrl.approve);
router.put('/:id/edit', ctrl.edit);
router.post('/publish', ctrl.publish);

module.exports = router;
