const { DatabaseConnection, AuditLog } = require('../models');
const { encrypt } = require('../config/encryption');
const {
  createConnection,
  getTables,
  getTableSchema,
  closeConnection,
} = require('../services/dbAdapter');
const canAccess = (connection, user) =>
  user.role === 'admin' || connection.created_by === user.id;

const findAccessibleConnection = async (id, user) => {
  const connection = await DatabaseConnection.findByPk(id);
  if (!connection) {
    const error = new Error('Connection not found');
    error.statusCode = 404;
    throw error;
  }
  if (!canAccess(connection, user)) {
    const error = new Error('Not authorized to access this connection');
    error.statusCode = 403;
    throw error;
  }
  return connection;
};

const getAll = async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { created_by: req.user.id };
    const connections = await DatabaseConnection.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
    const safe = connections.map((c) => {
      const j = c.toJSON();
      delete j.encrypted_password;
      return j;
    });
    res.json({ success: true, data: safe });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      name,
      db_type,
      host,
      port,
      database_name,
      username,
      password,
      ssl_enabled,
      description,
      tags,
    } = req.body;
    const encrypted_password = encrypt(password);
    const conn = await DatabaseConnection.create({
      name,
      db_type,
      host,
      port,
      database_name,
      username,
      encrypted_password,
      ssl_enabled: !!ssl_enabled,
      description,
      tags,
      created_by: req.user.id,
    });
    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'CONNECTION_CREATED',
      resource_type: 'DatabaseConnection',
      resource_id: conn.id,
      ip_address: req.ip,
    });
    const safe = conn.toJSON();
    delete safe.encrypted_password;
    res.status(201).json({ success: true, message: 'Connection created', data: safe });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const conn = await findAccessibleConnection(req.params.id, req.user);
    const { password, ...rest } = req.body;
    if (password) rest.encrypted_password = encrypt(password);
    await conn.update(rest);
    const safe = conn.toJSON();
    delete safe.encrypted_password;
    res.json({ success: true, message: 'Connection updated', data: safe });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const conn = await findAccessibleConnection(req.params.id, req.user);
    await conn.destroy();
    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'CONNECTION_DELETED',
      resource_type: 'DatabaseConnection',
      resource_id: req.params.id,
      ip_address: req.ip,
    });
    res.json({ success: true, message: 'Connection deleted' });
  } catch (err) {
    next(err);
  }
};

const testConnection = async (req, res, next) => {
  try {
    const conn = await findAccessibleConnection(req.params.id, req.user);
    let dbConn = null;
    try {
      dbConn = await createConnection(conn);
      const tables = await getTables(dbConn);
      await conn.update({ status: 'connected', last_tested_at: new Date() });
      res.json({
        success: true,
        message: 'Connection successful',
        data: { table_count: tables.length },
      });
    } catch (err) {
      console.error('Connection test failed:', {
        connectionId: conn.id,
        dbType: conn.db_type,
        host: conn.host,
        port: conn.port,
        database: conn.database_name,
        code: err.code,
        message: err.message,
      });
      await conn.update({ status: 'failed', last_tested_at: new Date() });
      res.status(400).json({
        success: false,
        message: `Connection failed: ${err.message}`,
        code: err.code,
      });
    } finally {
      if (dbConn) await closeConnection(dbConn);
    }
  } catch (err) {
    next(err);
  }
};

const listTables = async (req, res, next) => {
  try {
    const conn = await findAccessibleConnection(req.params.id, req.user);
    let dbConn = null;
    try {
      dbConn = await createConnection(conn);
      const tables = await getTables(dbConn);
      res.json({ success: true, data: tables });
    } finally {
      if (dbConn) await closeConnection(dbConn);
    }
  } catch (err) {
    next(err);
  }
};

const getTableColumns = async (req, res, next) => {
  try {
    const conn = await findAccessibleConnection(req.params.id, req.user);
    let dbConn = null;
    try {
      dbConn = await createConnection(conn);
      const schema = await getTableSchema(dbConn, req.params.table);
      res.json({ success: true, data: schema });
    } finally {
      if (dbConn) await closeConnection(dbConn);
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove, testConnection, listTables, getTableColumns };
