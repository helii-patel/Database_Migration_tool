const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/monitoringController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/:connId/metrics', ctrl.getMetrics);
router.get('/:connId/history', ctrl.getHistory);
router.get('/:connId/slow-queries', ctrl.getSlowQueries);

module.exports = router;
