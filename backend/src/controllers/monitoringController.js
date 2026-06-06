const { PerformanceSnapshot, DatabaseConnection } = require('../models');
const { Op } = require('sequelize');
const { captureSnapshot } = require('../services/monitoringService');

const getMetrics = async (req, res, next) => {
  try {
    const { connId } = req.params;
    const conn = await DatabaseConnection.findByPk(connId);
    if (!conn) return res.status(404).json({ success: false, message: 'Connection not found' });
    await captureSnapshot(connId, null);
    const latest = await PerformanceSnapshot.findOne({ where: { connection_id: connId }, order: [['captured_at', 'DESC']] });
    res.json({ success: true, data: latest });
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    const { connId } = req.params;
    const minutes = parseInt(req.query.minutes) || 30;
    const since = new Date(Date.now() - minutes * 60 * 1000);
    const snapshots = await PerformanceSnapshot.findAll({
      where: { connection_id: connId, captured_at: { [Op.gte]: since } },
      order: [['captured_at', 'ASC']],
      limit: 300,
    });
    res.json({ success: true, data: snapshots });
  } catch (err) { next(err); }
};

const getSlowQueries = async (req, res, next) => {
  try {
    const { connId } = req.params;
    const snapshots = await PerformanceSnapshot.findAll({
      where: { connection_id: connId, slow_queries: { [Op.gt]: 0 } },
      order: [['captured_at', 'DESC']],
      limit: 20,
      attributes: ['captured_at', 'slow_queries', 'avg_query_time_ms'],
    });
    res.json({ success: true, data: snapshots });
  } catch (err) { next(err); }
};

module.exports = { getMetrics, getHistory, getSlowQueries };
