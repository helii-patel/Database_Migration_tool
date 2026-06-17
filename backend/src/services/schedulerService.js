const cron = require('node-cron');
const { MigrationJob } = require('../models');
const { runMigration } = require('./migrationService');
const logger = require('../utils/logger');

let io = null;
let schedulerTask = null;

const setIo = (socketIo) => {
  io = socketIo;
};

/**
 * Checks for scheduled jobs and runs them
 */
const checkScheduledJobs = async () => {
  try {
    const { Op } = require('sequelize');
    const now = new Date();
    const jobs = await MigrationJob.findAll({
      where: {
        status: 'pending',
        scheduled_at: { [Op.lte]: now },
      },
    });

    for (const job of jobs) {
      logger.info(`Running scheduled migration job: ${job.id}`);
      runMigration(job.id, io).catch((err) =>
        logger.error(`Scheduled job ${job.id} failed: ${err.message}`)
      );
    }
  } catch (err) {
    logger.error('Scheduler check error:', err.message);
  }
};

/**
 * Starts the cron scheduler - checks every minute
 */
const startScheduler = (socketIo) => {
  io = socketIo;
  if (schedulerTask) return;
  schedulerTask = cron.schedule('* * * * *', checkScheduledJobs);
  logger.info('✅ Migration scheduler started');
};

const stopScheduler = () => {
  if (schedulerTask) {
    schedulerTask.destroy();
    schedulerTask = null;
    logger.info('Migration scheduler stopped');
  }
};

module.exports = { startScheduler, stopScheduler, setIo };
