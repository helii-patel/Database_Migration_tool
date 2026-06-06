const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MigrationLog = sequelize.define('MigrationLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  job_id: { type: DataTypes.UUID, allowNull: false },
  table_name: { type: DataTypes.STRING(200), allowNull: false },
  event_type: { type: DataTypes.ENUM('info', 'warning', 'error', 'success', 'progress'), defaultValue: 'info' },
  records_migrated: { type: DataTypes.BIGINT, defaultValue: 0 },
  records_failed: { type: DataTypes.BIGINT, defaultValue: 0 },
  message: { type: DataTypes.TEXT },
  batch_number: { type: DataTypes.INTEGER, defaultValue: 0 },
  duration_ms: { type: DataTypes.INTEGER },
}, {
  tableName: 'migration_logs',
});

module.exports = MigrationLog;
