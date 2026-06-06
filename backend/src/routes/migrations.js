const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/migrationController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', roleGuard('admin', 'engineer'), ctrl.create);
router.post('/:id/cancel', roleGuard('admin', 'engineer'), ctrl.cancel);
router.post('/:id/retry', roleGuard('admin', 'engineer'), ctrl.retry);
router.get('/:id/logs', ctrl.getLogs);
router.post('/:id/validate', ctrl.runValidation || require('../controllers/validationController').runValidation);

module.exports = router;
