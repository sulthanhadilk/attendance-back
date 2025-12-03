const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/auditController');

router.get('/', ctrl.list);
router.get('/export', ctrl.exportCsv);

module.exports = router;
