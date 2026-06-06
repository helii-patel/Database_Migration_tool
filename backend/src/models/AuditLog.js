const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID },
  username: { type: DataTypes.STRING(50) },
  action: { type: DataTypes.STRING(100), allowNull: false },
  resource_type: { type: DataTypes.STRING(50) },
  resource_id: { type: DataTypes.STRING(100) },
  details: { type: DataTypes.JSON, defaultValue: {} },
  ip_address: { type: DataTypes.STRING(45) },
  user_agent: { type: DataTypes.STRING(500) },
  status: { type: DataTypes.ENUM('success', 'failure'), defaultValue: 'success' },
}, {
  tableName: 'audit_logs',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['action'] },
    { fields: ['created_at'] },
  ],
});

module.exports = AuditLog;
