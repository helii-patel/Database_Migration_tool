const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ValidationReport = sequelize.define('ValidationReport', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  job_id: { type: DataTypes.UUID, allowNull: false },
  table_name: { type: DataTypes.STRING(200), allowNull: false },
  source_count: { type: DataTypes.BIGINT, defaultValue: 0 },
  destination_count: { type: DataTypes.BIGINT, defaultValue: 0 },
  missing_records: { type: DataTypes.BIGINT, defaultValue: 0 },
  duplicate_records: { type: DataTypes.BIGINT, defaultValue: 0 },
  extra_records: { type: DataTypes.BIGINT, defaultValue: 0 },
  status: { type: DataTypes.ENUM('passed', 'failed', 'warning', 'pending'), defaultValue: 'pending' },
  checksum_match: { type: DataTypes.BOOLEAN },
  validated_at: { type: DataTypes.DATE },
  details: { type: DataTypes.JSON, defaultValue: {} },
}, {
  tableName: 'validation_reports',
});

module.exports = ValidationReport;
