const json2csv = require('json2csv').parse;
const fs = require('fs');
const path = require('path');
const { AuditLog, MigrationJob, MigrationLog, ValidationReport } = require('../models');

const exportToCSV = async (data, filename) => {
  try {
    const csv = json2csv(data);
    const dir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${filename}_${Date.now()}.csv`);
    fs.writeFileSync(filePath, csv);
    return filePath;
  } catch (err) {
    throw new Error(`CSV export failed: ${err.message}`);
  }
};

const generateMigrationReport = async (jobId) => {
  const job = await MigrationJob.findByPk(jobId, {
    include: [{ model: MigrationLog, as: 'logs' }],
  });
  if (!job) throw new Error('Job not found');

  const reportData = job.logs.map((l) => ({
    Table: l.table_name,
    Event: l.event_type,
    'Records Migrated': l.records_migrated,
    'Records Failed': l.records_failed,
    Message: l.message,
    Batch: l.batch_number,
    'Duration (ms)': l.duration_ms || '',
    Timestamp: l.created_at,
  }));

  return exportToCSV(reportData, `migration_report_${jobId.slice(0, 8)}`);
};

const generateAuditReport = async (filters = {}) => {
  const where = {};
  if (filters.startDate && filters.endDate) {
    const { Op } = require('sequelize');
    where.created_at = { [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)] };
  }
  const logs = await AuditLog.findAll({ where, order: [['created_at', 'DESC']], limit: 5000 });
  const data = logs.map((l) => ({
    User: l.username,
    Action: l.action,
    'Resource Type': l.resource_type || '',
    'Resource ID': l.resource_id || '',
    Status: l.status,
    'IP Address': l.ip_address,
    Timestamp: l.created_at,
  }));
  return exportToCSV(data, 'audit_report');
};

module.exports = { exportToCSV, generateMigrationReport, generateAuditReport };
