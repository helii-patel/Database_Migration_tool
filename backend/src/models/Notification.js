const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define(
  'Notification',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        'migration_complete',
        'migration_failed',
        'performance_alert',
        'validation_complete',
        'system'
      ),
      defaultValue: 'system',
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    resource_type: { type: DataTypes.STRING(50) },
    resource_id: { type: DataTypes.STRING(100) },
    severity: { type: DataTypes.ENUM('info', 'warning', 'error', 'success'), defaultValue: 'info' },
  },
  {
    tableName: 'notifications',
    indexes: [{ fields: ['user_id', 'is_read'] }],
  }
);

module.exports = Notification;
