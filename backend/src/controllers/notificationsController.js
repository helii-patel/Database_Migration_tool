const { Notification } = require('../models');

const getAll = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

const deleteNotification = async (req, res, next) => {
  try {
    await Notification.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
};

module.exports = { getAll, markRead, markAllRead, deleteNotification };
