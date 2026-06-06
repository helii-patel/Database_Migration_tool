const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DatabaseConnection = sequelize.define('DatabaseConnection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  db_type: { type: DataTypes.ENUM('mysql', 'postgresql'), allowNull: false },
  host: { type: DataTypes.STRING(255), allowNull: false },
  port: { type: DataTypes.INTEGER, allowNull: false },
  database_name: { type: DataTypes.STRING(255), allowNull: false },
  username: { type: DataTypes.STRING(100), allowNull: false },
  encrypted_password: { type: DataTypes.TEXT, allowNull: false },
  ssl_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.ENUM('unknown', 'connected', 'failed'), defaultValue: 'unknown' },
  last_tested_at: { type: DataTypes.DATE },
  created_by: { type: DataTypes.UUID, allowNull: false },
  tags: { type: DataTypes.JSON, defaultValue: [] },
  description: { type: DataTypes.TEXT },
}, {
  tableName: 'database_connections',
});

module.exports = DatabaseConnection;
