const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getAll,
  markRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notificationsController');

router.use(authenticate);
router.get('/', getAll);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;
