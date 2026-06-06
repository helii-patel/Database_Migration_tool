const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/connectionController');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.post('/', roleGuard('admin', 'engineer'), ctrl.create);
router.put('/:id', roleGuard('admin', 'engineer'), ctrl.update);
router.delete('/:id', roleGuard('admin', 'engineer'), ctrl.remove);
router.post('/:id/test', ctrl.testConnection);
router.get('/:id/tables', ctrl.listTables);
router.get('/:id/tables/:table/columns', ctrl.getTableColumns);

module.exports = router;
