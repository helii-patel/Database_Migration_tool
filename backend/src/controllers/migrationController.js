const { MigrationJob, MigrationLog, DatabaseConnection, AuditLog } = require('../models');
const { runMigration } = require('../services/migrationService');
const logger = require('../utils/logger');

let ioRef = null;
const setIo = (io) => { ioRef = io; };

const getAll = async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { created_by: req.user.id };
    const jobs = await MigrationJob.findAll({
      where,
      include: [
        { model: DatabaseConnection, as: 'sourceConnection', attributes: ['id', 'name', 'db_type'] },
        { model: DatabaseConnection, as: 'destinationConnection', attributes: ['id', 'name', 'db_type'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: jobs });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const job = await MigrationJob.findByPk(req.params.id, {
      include: [
        { model: DatabaseConnection, as: 'sourceConnection', attributes: ['id', 'name', 'db_type', 'host'] },
        { model: DatabaseConnection, as: 'destinationConnection', attributes: ['id', 'name', 'db_type', 'host'] },
        { model: MigrationLog, as: 'logs', order: [['created_at', 'ASC']], limit: 200 },
      ],
    });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, source_connection_id, destination_connection_id, tables, migration_type, scheduled_at, options } = req.body;
    if (!tables || !Array.isArray(tables) || tables.length === 0)
      return res.status(400).json({ success: false, message: 'At least one table must be selected' });

    const job = await MigrationJob.create({
      name, source_connection_id, destination_connection_id, tables,
      migration_type: migration_type || 'full',
      created_by: req.user.id,
      scheduled_at: scheduled_at || null,
      options: options || {},
    });

    await AuditLog.create({ user_id: req.user.id, username: req.user.username, action: 'MIGRATION_CREATED', resource_type: 'MigrationJob', resource_id: job.id, ip_address: req.ip, details: { name, tables, migration_type } });

    // Start immediately if not scheduled
    if (!scheduled_at) {
      setImmediate(() => runMigration(job.id, ioRef).catch((err) => logger.error(`Migration ${job.id} error: ${err.message}`)));
    }

    res.status(201).json({ success: true, message: 'Migration job created', data: job });
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const job = await MigrationJob.findByPk(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (!['running', 'pending'].includes(job.status))
      return res.status(400).json({ success: false, message: 'Job cannot be cancelled in current state' });
    await job.update({ status: 'cancelled', completed_at: new Date() });
    res.json({ success: true, message: 'Job cancelled' });
  } catch (err) { next(err); }
};

const retry = async (req, res, next) => {
  try {
    const original = await MigrationJob.findByPk(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Job not found' });
    const retryJob = await MigrationJob.create({
      name: `${original.name} (Retry)`,
      source_connection_id: original.source_connection_id,
      destination_connection_id: original.destination_connection_id,
      tables: original.tables,
      migration_type: original.migration_type,
      created_by: req.user.id,
      options: original.options,
    });
    setImmediate(() => runMigration(retryJob.id, ioRef).catch((err) => logger.error(`Retry Migration ${retryJob.id} error: ${err.message}`)));
    res.status(201).json({ success: true, message: 'Retry job started', data: retryJob });
  } catch (err) { next(err); }
};

const getLogs = async (req, res, next) => {
  try {
    const logs = await MigrationLog.findAll({
      where: { job_id: req.params.id },
      order: [['created_at', 'ASC']],
      limit: 500,
    });
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, cancel, retry, getLogs, setIo };
