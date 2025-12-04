const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/finesController');
router.get('/', ctrl.list);
router.put('/:id/status', ctrl.updateStatus);
router.put('/:id/edit', ctrl.editFine);
router.post('/:id/approve', ctrl.approveFine);
module.exports = router;
