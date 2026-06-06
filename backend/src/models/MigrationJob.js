const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MigrationJob = sequelize.define('MigrationJob', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  source_connection_id: { type: DataTypes.UUID, allowNull: false },
  destination_connection_id: { type: DataTypes.UUID, allowNull: false },
  tables: { type: DataTypes.JSON, allowNull: false, comment: 'Array of table names to migrate' },
  migration_type: { type: DataTypes.ENUM('full', 'incremental'), defaultValue: 'full' },
  status: { type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'cancelled'), defaultValue: 'pending' },
  progress: { type: DataTypes.FLOAT, defaultValue: 0, validate: { min: 0, max: 100 } },
  total_records: { type: DataTypes.BIGINT, defaultValue: 0 },
  migrated_records: { type: DataTypes.BIGINT, defaultValue: 0 },
  failed_records: { type: DataTypes.BIGINT, defaultValue: 0 },
  started_at: { type: DataTypes.DATE },
  completed_at: { type: DataTypes.DATE },
  error_message: { type: DataTypes.TEXT },
  created_by: { type: DataTypes.UUID, allowNull: false },
  scheduled_at: { type: DataTypes.DATE },
  options: { type: DataTypes.JSON, defaultValue: {} },
}, {
  tableName: 'migration_jobs',
});

module.exports = MigrationJob;
