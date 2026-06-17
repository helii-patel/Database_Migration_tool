const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PerformanceSnapshot = sequelize.define(
  'PerformanceSnapshot',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    connection_id: { type: DataTypes.UUID, allowNull: false },
    cpu_usage: { type: DataTypes.FLOAT, defaultValue: 0, comment: 'percentage 0-100' },
    memory_usage: { type: DataTypes.FLOAT, defaultValue: 0, comment: 'percentage 0-100' },
    memory_total_mb: { type: DataTypes.FLOAT, defaultValue: 0 },
    memory_used_mb: { type: DataTypes.FLOAT, defaultValue: 0 },
    active_connections: { type: DataTypes.INTEGER, defaultValue: 0 },
    max_connections: { type: DataTypes.INTEGER, defaultValue: 0 },
    transactions_per_second: { type: DataTypes.FLOAT, defaultValue: 0 },
    queries_per_second: { type: DataTypes.FLOAT, defaultValue: 0 },
    slow_queries: { type: DataTypes.INTEGER, defaultValue: 0 },
    avg_query_time_ms: { type: DataTypes.FLOAT, defaultValue: 0 },
    buffer_hit_ratio: { type: DataTypes.FLOAT, defaultValue: 0 },
    disk_reads: { type: DataTypes.BIGINT, defaultValue: 0 },
    cache_reads: { type: DataTypes.BIGINT, defaultValue: 0 },
    uptime_seconds: { type: DataTypes.BIGINT, defaultValue: 0 },
    captured_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'performance_snapshots',
    timestamps: false,
    indexes: [{ fields: ['connection_id'] }, { fields: ['captured_at'] }],
  }
);

module.exports = PerformanceSnapshot;
