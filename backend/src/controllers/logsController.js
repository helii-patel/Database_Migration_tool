const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');

const getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, action, user_id, startDate, endDate, status } = req.query;
    const where = {};
    if (req.user.role !== 'admin') where.user_id = req.user.id;
    if (search)
      where[Op.or] = [
        { action: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
      ];
    if (action) where.action = action;
    if (user_id) where.user_id = user_id;
    if (status) where.status = status;
    if (startDate && endDate)
      where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate)] };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });
    res.json({
      success: true,
      data: {
        logs: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

const exportLogs = async (req, res, next) => {
  try {
    const { generateAuditReport } = require('../utils/reportGenerator');
    const filePath = await generateAuditReport(req.query);
    res.download(filePath, 'audit_report.csv', (err) => {
      if (err) next(err);
      else fs.unlink(filePath, () => {});
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs, exportLogs };
