const {
  MigrationJob,
  DatabaseConnection,
  ValidationReport,
} = require('../models');
const { Op } = require('sequelize');

const safeValidationCounts = async () => {
  try {
    const [totalValidations, passedValidations] = await Promise.all([
      ValidationReport.count(),
      ValidationReport.count({ where: { status: 'passed' } }),
    ]);
    return { totalValidations, passedValidations };
  } catch (_) {
    return { totalValidations: 0, passedValidations: 0 };
  }
};

const getOverview = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? undefined : req.user.id;
    const where = userId ? { created_by: userId } : {};

    const [
      totalMigrations,
      completedMigrations,
      failedMigrations,
      runningMigrations,
      totalConnections,
      validationCounts,
    ] = await Promise.all([
      MigrationJob.count({ where }),
      MigrationJob.count({ where: { ...where, status: 'completed' } }),
      MigrationJob.count({ where: { ...where, status: 'failed' } }),
      MigrationJob.count({ where: { ...where, status: 'running' } }),
      DatabaseConnection.count({ where: userId ? { created_by: userId } : {} }),
      safeValidationCounts(),
    ]);
    const { totalValidations, passedValidations } = validationCounts;

    const successRate =
      totalMigrations > 0 ? Math.round((completedMigrations / totalMigrations) * 100) : 0;
    const validationRate =
      totalValidations > 0 ? Math.round((passedValidations / totalValidations) * 100) : 0;

    // Get total records migrated
    const totalRecordsMigrated =
      (await MigrationJob.sum('migrated_records', { where: { ...where, status: 'completed' } })) ||
      0;

    // Migration trends (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentJobs = await MigrationJob.findAll({
      where: { ...where, created_at: { [Op.gte]: sevenDaysAgo } },
      attributes: ['status', 'created_at', 'migrated_records'],
      order: [['created_at', 'ASC']],
    });

    // Group by day
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trendMap[key] = { date: key, completed: 0, failed: 0, total: 0 };
    }
    recentJobs.forEach((j) => {
      const rawDate = j.created_at || j.createdAt;
      if (!rawDate) return;
      const parsedDate = new Date(rawDate);
      if (Number.isNaN(parsedDate.getTime())) return;
      const key = parsedDate.toISOString().split('T')[0];
      if (trendMap[key]) {
        trendMap[key].total++;
        if (j.status === 'completed') trendMap[key].completed++;
        if (j.status === 'failed') trendMap[key].failed++;
      }
    });

    // System health score (0-100)
    const healthScore = Math.max(
      0,
      Math.min(100, 60 + successRate * 0.25 + validationRate * 0.15 - failedMigrations * 2)
    );

    res.json({
      success: true,
      data: {
        kpis: {
          totalMigrations,
          completedMigrations,
          failedMigrations,
          runningMigrations,
          successRate,
          totalConnections,
          totalRecordsMigrated,
          validationRate,
          healthScore: Math.round(healthScore),
        },
        trends: Object.values(trendMap),
        recentActivity: recentJobs.slice(-5),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getDbGrowth = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const jobs = await MigrationJob.findAll({
      where: { status: 'completed', completed_at: { [Op.gte]: thirtyDaysAgo } },
      attributes: ['completed_at', 'migrated_records'],
      order: [['completed_at', 'ASC']],
    });
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
};

module.exports = { getOverview, getDbGrowth };
