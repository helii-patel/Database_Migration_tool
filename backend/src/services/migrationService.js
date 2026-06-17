const {
  MigrationJob,
  MigrationLog,
  DatabaseConnection,
  Notification,
} = require('../models');
const {
  createConnection,
  getTableCount,
  getTableSchema,
  getUniqueConstraints,
  getForeignKeys,
  ensureTable,
  fetchBatch,
  insertBatch,
  truncateTable,
  addForeignKeys,
  syncGeneratedKeys,
  closeConnection,
} = require('./dbAdapter');
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

  const [claimed] = await MigrationJob.update(
    { status: 'running', started_at: new Date() },
    { where: { id: jobId, status: 'pending' } }
  );
  if (!claimed) {
    logger.warn(`Migration job ${jobId} was already claimed or is not pending`);
    return;
  }
  await job.reload();
  emit('job_status', { jobId, status: 'running' });

  let srcConn, dstConn;

  try {
    logger.info(`Starting migration job ${jobId}`);
    srcConn = await createConnection(job.sourceConnection);
    dstConn = await createConnection(job.destinationConnection);

    const { tables } = job;
    const options = {
      create_missing_tables: true,
      existing_data_strategy: 'fail',
      continue_on_error: false,
      ...(job.options || {}),
    };
    let totalRecords = 0;
    let migratedRecords = 0;
    let processedRecords = 0;
    let failedRecords = 0;
    const failedTables = [];
    const tableCounts = new Map();
    const tableForeignKeys = new Map();

    // Phase 1: count all records
    for (const tableName of tables) {
      try {
        const count = await getTableCount(srcConn, tableName);
        tableCounts.set(tableName, count);
        totalRecords += count;
        await MigrationLog.create({
          job_id: jobId,
          table_name: tableName,
          event_type: 'info',
          message: `Table "${tableName}" has ${count} records to migrate`,
        });
      } catch (err) {
        await MigrationLog.create({
          job_id: jobId,
          table_name: tableName,
          event_type: 'error',
          message: `Could not count rows in "${tableName}": ${err.message}`,
        });
        throw err;
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
      try {
        const schema = await getTableSchema(srcConn, tableName);
        schema.uniqueConstraints = await getUniqueConstraints(srcConn, tableName);
        schema.foreignKeys = await getForeignKeys(srcConn, tableName);
        tableForeignKeys.set(tableName, schema.foreignKeys);
        const primaryKeys = schema.filter((column) => column.primaryKey).map((column) => column.name);
        const created = await ensureTable(
          dstConn,
          tableName,
          schema,
          options.create_missing_tables !== false
        );
        tableTotal = tableCounts.get(tableName);
        const batchSize = Math.max(1, Math.min(BATCH_SIZE, Math.floor(60000 / schema.length)));

        emit('table_start', { jobId, tableName, tableTotal });
        await MigrationLog.create({
          job_id: jobId,
          table_name: tableName,
          event_type: 'info',
          message: `Starting migration of "${tableName}" (${tableTotal} records)`,
        });

        if (!created) {
          const destinationSchema = await getTableSchema(dstConn, tableName);
          const destinationColumns = new Set(destinationSchema.map((column) => column.name));
          const missingColumns = schema
            .map((column) => column.name)
            .filter((column) => !destinationColumns.has(column));
          if (missingColumns.length) {
            throw new Error(
              `Destination table "${tableName}" is missing columns: ${missingColumns.join(', ')}`
            );
          }
          const destinationCount = await getTableCount(dstConn, tableName);
          if (destinationCount > 0 && options.existing_data_strategy === 'fail') {
            throw new Error(
              `Destination table "${tableName}" contains ${destinationCount} rows. ` +
                'Choose skip or truncate explicitly.'
            );
          }
          if (
            destinationCount > 0 &&
            options.existing_data_strategy === 'skip' &&
            primaryKeys.length === 0
          ) {
            throw new Error(
              `Cannot safely skip conflicts for "${tableName}" because it has no primary key`
            );
          }
          if (destinationCount > 0 && options.existing_data_strategy === 'truncate') {
            await truncateTable(dstConn, tableName);
            await MigrationLog.create({
              job_id: jobId,
              table_name: tableName,
              event_type: 'warning',
              message: `Truncated ${destinationCount} existing destination rows`,
            });
          }
        }

        while (offset < tableTotal) {
          const rows = await fetchBatch(srcConn, tableName, offset, batchSize, primaryKeys);
          if (!rows || rows.length === 0) break;

          const batchStart = Date.now();
          const inserted = await insertBatch(
            dstConn,
            tableName,
            rows,
            options.existing_data_strategy === 'skip' ? 'skip' : 'fail',
            schema
          );
          const duration = Date.now() - batchStart;

          batchNum++;
          tableMigrated += inserted;
          migratedRecords += inserted;
          processedRecords += rows.length;
          offset += rows.length;

          const progress =
            totalRecords > 0 ? Math.round((processedRecords / totalRecords) * 100 * 10) / 10 : 0;

          await job.update({ migrated_records: migratedRecords, progress });
          emit('progress', { jobId, tableName, progress, migratedRecords, totalRecords, batchNum });

          await MigrationLog.create({
            job_id: jobId,
            table_name: tableName,
            event_type: 'progress',
            records_migrated: inserted,
            batch_number: batchNum,
            duration_ms: duration,
            message:
              `Batch ${batchNum}: migrated ${inserted} rows` +
              `${inserted < rows.length ? `, skipped ${rows.length - inserted}` : ''}` +
              ` (total inserted: ${tableMigrated}/${tableTotal})`,
          });

          // Check if job was cancelled
          await job.reload();
          if (job.status === 'cancelled') {
            throw new Error('Job cancelled by user');
          }
        }

        await syncGeneratedKeys(dstConn, tableName, schema);
        await MigrationLog.create({
          job_id: jobId,
          table_name: tableName,
          event_type: 'success',
          records_migrated: tableMigrated,
          message: `✅ Completed migration of "${tableName}": ${tableMigrated} records migrated`,
        });
        emit('table_complete', { jobId, tableName, tableMigrated });
      } catch (err) {
        await MigrationLog.create({
          job_id: jobId,
          table_name: tableName,
          event_type: 'error',
          message: `❌ Error migrating "${tableName}": ${err.message}`,
        });
        emit('table_error', { jobId, tableName, error: err.message });
        logger.error(`Migration error on table ${tableName}:`, err);

        if (err.message === 'Job cancelled by user') {
          await job.update({
            status: 'cancelled',
            completed_at: new Date(),
            progress: (migratedRecords / Math.max(totalRecords, 1)) * 100,
          });
          emit('job_status', { jobId, status: 'cancelled' });
          return;
        }
        const remainingRecords = Math.max(tableTotal - tableMigrated, 0);
        failedRecords += remainingRecords;
        failedTables.push({ tableName, error: err.message });
        await job.update({ failed_records: failedRecords });
        if (!options.continue_on_error) throw err;
      }
    }

    // Phase 3: Add foreign keys
    for (const tableName of tables) {
      if (failedTables.find(t => t.tableName === tableName)) continue;
      const foreignKeys = tableForeignKeys.get(tableName);
      if (foreignKeys && foreignKeys.length > 0) {
        try {
          await addForeignKeys(dstConn, tableName, foreignKeys);
          await MigrationLog.create({
            job_id: jobId,
            table_name: tableName,
            event_type: 'info',
            message: `Added foreign keys for "${tableName}"`,
          });
        } catch (err) {
          logger.warn(`Failed to add foreign keys for ${tableName}: ${err.message}`);
          await MigrationLog.create({
            job_id: jobId,
            table_name: tableName,
            event_type: 'warning',
            message: `Could not add foreign keys for "${tableName}": ${err.message}`,
          });
        }
      }
    }

    const finalStatus = failedTables.length ? 'failed' : 'completed';
    await job.update({
      status: finalStatus,
      completed_at: new Date(),
      progress: failedTables.length
        ? totalRecords > 0
          ? (processedRecords / totalRecords) * 100
          : 0
        : 100,
      migrated_records: migratedRecords,
      failed_records: failedRecords,
      error_message: failedTables.length
        ? failedTables.map((item) => `${item.tableName}: ${item.error}`).join('; ')
        : null,
    });
    emit('job_status', {
      jobId,
      status: finalStatus,
      migratedRecords,
      totalRecords,
      failedRecords,
    });

    // Create notification
    await Notification.create({
      user_id: job.created_by,
      type: finalStatus === 'completed' ? 'migration_complete' : 'migration_failed',
      severity: finalStatus === 'completed' ? 'success' : 'error',
      title: finalStatus === 'completed' ? 'Migration Completed' : 'Migration Completed with Errors',
      message:
        finalStatus === 'completed'
          ? `Migration job "${job.name}" completed. ${migratedRecords} records migrated successfully.`
          : `Migration job "${job.name}" failed for ${failedTables.length} table(s).`,
      resource_type: 'MigrationJob',
      resource_id: jobId,
    });

    logger.info(
      `Migration job ${jobId} ${finalStatus}: ${migratedRecords}/${totalRecords} records`
    );
  } catch (err) {
    logger.error(`Migration job ${jobId} failed:`, err);
    await job.update({ status: 'failed', completed_at: new Date(), error_message: err.message });
    emit('job_status', { jobId, status: 'failed', error: err.message });

    await Notification.create({
      user_id: job.created_by,
      type: 'migration_failed',
      severity: 'error',
      title: 'Migration Failed',
      message: `Migration job "${job.name}" failed: ${err.message}`,
      resource_type: 'MigrationJob',
      resource_id: jobId,
    });
  } finally {
    if (srcConn) await closeConnection(srcConn);
    if (dstConn) await closeConnection(dstConn);
  }
};

module.exports = { runMigration };
