const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/feesController');
router.get('/structure', ctrl.getStructure);
router.post('/structure', ctrl.setStructure);
router.get('/dues', ctrl.listDues);
router.post('/mark-paid', ctrl.markPaid);
router.get('/export', ctrl.exportFinance);
module.exports = router;
