const { MigrationJob, MigrationLog, DatabaseConnection, Notification, ValidationReport } = require('../models');
const { createConnection, getTables, getTableCount, fetchBatch, insertBatch, closeConnection } = require('./dbAdapter');
const logger = require('../utils/logger');

const BATCH_SIZE = parseInt(process.env.MIGRATION_BATCH_SIZE) || 1000;

/**
 * Core migration engine. Runs in background after API responds.
 */
const runMigration = async (jobId, io) => {
  const job = await MigrationJob.findByPk(jobId, {
    include: [
      { model: DatabaseConnection, as: 'sourceConnection' },
      { model: DatabaseConnection, as: 'destinationConnection' },
    ],
  });

  if (!job) {
    logger.error(`Migration job ${jobId} not found`);
    return;
  }

  const emit = (event, data) => {
    if (io) io.to(`job_${jobId}`).emit(event, data);
  };

  await job.update({ status: 'running', started_at: new Date() });
  emit('job_status', { jobId, status: 'running' });

  let srcConn, dstConn;

  try {
    logger.info(`Starting migration job ${jobId}`);
    srcConn = await createConnection(job.sourceConnection);
    dstConn = await createConnection(job.destinationConnection);

    const tables = job.tables;
    let totalRecords = 0;
    let migratedRecords = 0;

    // Phase 1: count all records
    for (const tableName of tables) {
      try {
        const count = await getTableCount(srcConn, tableName);
        totalRecords += count;
        await MigrationLog.create({
          job_id: jobId, table_name: tableName, event_type: 'info',
          message: `Table "${tableName}" has ${count} records to migrate`,
        });
      } catch (err) {
        await MigrationLog.create({
          job_id: jobId, table_name: tableName, event_type: 'warning',
          message: `Could not count rows in "${tableName}": ${err.message}`,
        });
      }
    }

    await job.update({ total_records: totalRecords });
    emit('total_records', { jobId, totalRecords });

    // Phase 2: migrate each table
    for (const tableName of tables) {
      let offset = 0;
      let tableTotal = 0;
      let tableMigrated = 0;
      let batchNum = 0;
      let tableError = null;

      try {
        tableTotal = await getTableCount(srcConn, tableName);

        emit('table_start', { jobId, tableName, tableTotal });
        await MigrationLog.create({
          job_id: jobId, table_name: tableName, event_type: 'info',
          message: `Starting migration of "${tableName}" (${tableTotal} records)`,
        });

        while (true) {
          const rows = await fetchBatch(srcConn, tableName, offset, BATCH_SIZE);
          if (!rows || rows.length === 0) break;

          const batchStart = Date.now();
          await insertBatch(dstConn, tableName, rows);
          const duration = Date.now() - batchStart;

          batchNum++;
          tableMigrated += rows.length;
          migratedRecords += rows.length;
          offset += rows.length;

          const progress = totalRecords > 0 ? Math.round((migratedRecords / totalRecords) * 100 * 10) / 10 : 0;

          await job.update({ migrated_records: migratedRecords, progress });
          emit('progress', { jobId, tableName, progress, migratedRecords, totalRecords, batchNum });

          await MigrationLog.create({
            job_id: jobId, table_name: tableName, event_type: 'progress',
            records_migrated: rows.length, batch_number: batchNum,
            duration_ms: duration,
            message: `Batch ${batchNum}: migrated ${rows.length} rows (total: ${tableMigrated}/${tableTotal})`,
          });

          // Check if job was cancelled
          await job.reload();
          if (job.status === 'cancelled') {
            throw new Error('Job cancelled by user');
          }
        }

        await MigrationLog.create({
          job_id: jobId, table_name: tableName, event_type: 'success',
          records_migrated: tableMigrated,
          message: `✅ Completed migration of "${tableName}": ${tableMigrated} records migrated`,
        });
        emit('table_complete', { jobId, tableName, tableMigrated });

      } catch (err) {
        tableError = err.message;
        await MigrationLog.create({
          job_id: jobId, table_name: tableName, event_type: 'error',
          message: `❌ Error migrating "${tableName}": ${err.message}`,
        });
        emit('table_error', { jobId, tableName, error: err.message });
        logger.error(`Migration error on table ${tableName}:`, err);

        if (err.message === 'Job cancelled by user') {
          await job.update({ status: 'cancelled', completed_at: new Date(), progress: migratedRecords / Math.max(totalRecords, 1) * 100 });
          emit('job_status', { jobId, status: 'cancelled' });
          return;
        }
      }
    }

    const finalStatus = 'completed';
    await job.update({ status: finalStatus, completed_at: new Date(), progress: 100, migrated_records: migratedRecords });
    emit('job_status', { jobId, status: finalStatus, migratedRecords, totalRecords });

    // Create notification
    await Notification.create({
      user_id: job.created_by, type: 'migration_complete', severity: 'success',
      title: 'Migration Completed', 
      message: `Migration job "${job.name}" completed. ${migratedRecords} records migrated successfully.`,
      resource_type: 'MigrationJob', resource_id: jobId,
    });

    logger.info(`Migration job ${jobId} completed: ${migratedRecords}/${totalRecords} records`);

  } catch (err) {
    logger.error(`Migration job ${jobId} failed:`, err);
    await job.update({ status: 'failed', completed_at: new Date(), error_message: err.message });
    emit('job_status', { jobId, status: 'failed', error: err.message });

    await Notification.create({
      user_id: job.created_by, type: 'migration_failed', severity: 'error',
      title: 'Migration Failed',
      message: `Migration job "${job.name}" failed: ${err.message}`,
      resource_type: 'MigrationJob', resource_id: jobId,
    });
  } finally {
    if (srcConn) await closeConnection(srcConn);
    if (dstConn) await closeConnection(dstConn);
  }
};

module.exports = { runMigration };
