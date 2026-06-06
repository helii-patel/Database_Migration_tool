const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getLogs, exportLogs } = require('../controllers/logsController');

router.use(authenticate);
router.get('/', getLogs);
router.get('/export', exportLogs);

module.exports = router;
