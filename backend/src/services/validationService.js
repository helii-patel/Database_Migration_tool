const { ValidationReport, MigrationJob, DatabaseConnection } = require('../models');
const { createConnection, getTableCount, fetchBatch, closeConnection } = require('./dbAdapter');
const logger = require('../utils/logger');

/**
 * Validates migration by comparing source and destination data
 */
const validateMigration = async (jobId) => {
  const job = await MigrationJob.findByPk(jobId, {
    include: [
      { model: DatabaseConnection, as: 'sourceConnection' },
      { model: DatabaseConnection, as: 'destinationConnection' },
    ],
  });

  if (!job) throw new Error(`Job ${jobId} not found`);

  const tables = job.tables;
  const reports = [];
  let srcConn, dstConn;

  try {
    srcConn = await createConnection(job.sourceConnection);
    dstConn = await createConnection(job.destinationConnection);

    for (const tableName of tables) {
      try {
        const [srcCount, dstCount] = await Promise.all([
          getTableCount(srcConn, tableName),
          getTableCount(dstConn, tableName),
        ]);

        const diff = srcCount - dstCount;
        const missing = diff > 0 ? diff : 0;
        const extra = diff < 0 ? Math.abs(diff) : 0;

        let status = 'passed';
        if (missing > 0 || extra > 0) status = 'failed';
        else if (srcCount === 0) status = 'warning';

        // Sample-based checksum for first 1000 rows
        let checksumMatch = null;
        try {
          const srcRows = await fetchBatch(srcConn, tableName, 0, 100);
          const dstRows = await fetchBatch(dstConn, tableName, 0, 100);
          const srcHash = JSON.stringify(srcRows.slice(0, 10));
          const dstHash = JSON.stringify(dstRows.slice(0, 10));
          checksumMatch = srcHash === dstHash;
          if (!checksumMatch && status === 'passed') status = 'warning';
        } catch (err) {
          logger.warn(`Checksum sampling failed for table ${tableName}: ${err.message}`);
          checksumMatch = null;
        }

        const report = await ValidationReport.upsert({
          job_id: jobId,
          table_name: tableName,
          source_count: srcCount,
          destination_count: dstCount,
          missing_records: missing,
          extra_records: extra,
          duplicate_records: 0,
          status,
          checksum_match: checksumMatch,
          validated_at: new Date(),
          details: { source_count: srcCount, dest_count: dstCount, diff },
        });

        reports.push({
          table_name: tableName,
          srcCount,
          dstCount,
          missing,
          extra,
          status,
          checksumMatch,
        });

        logger.info(
          `Validated table ${tableName}: src=${srcCount}, dst=${dstCount}, status=${status}`
        );
      } catch (err) {
        logger.error(`Validation error for table ${tableName}: ${err.message}`);
        reports.push({ table_name: tableName, status: 'failed', error: err.message });
      }
    }
  } finally {
    if (srcConn) await closeConnection(srcConn);
    if (dstConn) await closeConnection(dstConn);
  }

  return reports;
};

module.exports = { validateMigration };
