const { sequelize } = require('../config/db');
const User = require('./User');
const DatabaseConnection = require('./DatabaseConnection');
const MigrationJob = require('./MigrationJob');
const MigrationLog = require('./MigrationLog');
const ValidationReport = require('./ValidationReport');
const PerformanceSnapshot = require('./PerformanceSnapshot');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');

// User associations
User.hasMany(DatabaseConnection, { foreignKey: 'created_by', as: 'connections' });
DatabaseConnection.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(MigrationJob, { foreignKey: 'created_by', as: 'migrationJobs' });
MigrationJob.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Connection associations
DatabaseConnection.hasMany(MigrationJob, {
  foreignKey: 'source_connection_id',
  as: 'sourceMigrations',
});
DatabaseConnection.hasMany(MigrationJob, {
  foreignKey: 'destination_connection_id',
  as: 'destMigrations',
});
MigrationJob.belongsTo(DatabaseConnection, {
  foreignKey: 'source_connection_id',
  as: 'sourceConnection',
});
MigrationJob.belongsTo(DatabaseConnection, {
  foreignKey: 'destination_connection_id',
  as: 'destinationConnection',
});

DatabaseConnection.hasMany(PerformanceSnapshot, { foreignKey: 'connection_id', as: 'snapshots' });
PerformanceSnapshot.belongsTo(DatabaseConnection, {
  foreignKey: 'connection_id',
  as: 'connection',
});

// Migration job associations
MigrationJob.hasMany(MigrationLog, { foreignKey: 'job_id', as: 'logs' });
MigrationLog.belongsTo(MigrationJob, { foreignKey: 'job_id', as: 'job' });

MigrationJob.hasMany(ValidationReport, { foreignKey: 'job_id', as: 'validationReports' });
ValidationReport.belongsTo(MigrationJob, { foreignKey: 'job_id', as: 'job' });

module.exports = {
  sequelize,
  User,
  DatabaseConnection,
  MigrationJob,
  MigrationLog,
  ValidationReport,
  PerformanceSnapshot,
  AuditLog,
  Notification,
};
