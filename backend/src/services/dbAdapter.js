const mysql = require('mysql2/promise');
const { Client } = require('pg');
const { decrypt } = require('../config/encryption');
const logger = require('../utils/logger');

/**
 * Creates a live connection to a target database (not system DB)
 */
const createConnection = async (connectionConfig) => {
  const password = decrypt(connectionConfig.encrypted_password);

  if (connectionConfig.db_type === 'mysql') {
    const conn = await mysql.createConnection({
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.username,
      password,
      database: connectionConfig.database_name,
      ssl: connectionConfig.ssl_enabled ? { rejectUnauthorized: false } : false,
      connectTimeout: 10000,
    });
    return { conn, type: 'mysql' };
  } else if (connectionConfig.db_type === 'postgresql') {
    const client = new Client({
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.username,
      password,
      database: connectionConfig.database_name,
      ssl: connectionConfig.ssl_enabled ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
    });
    await client.connect();
    return { conn: client, type: 'postgresql' };
  }
  throw new Error(`Unsupported database type: ${connectionConfig.db_type}`);
};

/**
 * Fetches list of tables from a connection
 */
const getTables = async ({ conn, type }) => {
  if (type === 'mysql') {
    const [rows] = await conn.query('SHOW TABLES');
    const key = Object.keys(rows[0] || {})[0];
    return rows.map((r) => r[key]);
  } else {
    const res = await conn.query(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' ORDER BY tablename`
    );
    return res.rows.map((r) => r.tablename);
  }
};

/**
 * Gets row count for a table
 */
const getTableCount = async ({ conn, type }, tableName) => {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  if (type === 'mysql') {
    const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${safeName}\``);
    return parseInt(rows[0].cnt);
  } else {
    const res = await conn.query(`SELECT COUNT(*) as cnt FROM "${safeName}"`);
    return parseInt(res.rows[0].cnt);
  }
};

/**
 * Gets table schema (column definitions)
 */
const getTableSchema = async ({ conn, type }, tableName) => {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  if (type === 'mysql') {
    const [rows] = await conn.query(`DESCRIBE \`${safeName}\``);
    return rows.map((r) => ({ name: r.Field, type: r.Type, nullable: r.Null === 'YES', key: r.Key, default: r.Default }));
  } else {
    const res = await conn.query(
      `SELECT column_name as name, data_type as type, is_nullable as nullable
       FROM information_schema.columns WHERE table_name=$1 AND table_schema='public' ORDER BY ordinal_position`,
      [safeName]
    );
    return res.rows;
  }
};

/**
 * Fetches a batch of rows from a table
 */
const fetchBatch = async ({ conn, type }, tableName, offset, limit) => {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  if (type === 'mysql') {
    const [rows] = await conn.query(`SELECT * FROM \`${safeName}\` LIMIT ? OFFSET ?`, [limit, offset]);
    return rows;
  } else {
    const res = await conn.query(`SELECT * FROM "${safeName}" LIMIT $1 OFFSET $2`, [limit, offset]);
    return res.rows;
  }
};

/**
 * Creates table in destination if not exists, based on source schema
 */
const ensureTable = async ({ conn, type }, tableName, schema) => {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  try {
    if (type === 'mysql') {
      await conn.query(`CREATE TABLE IF NOT EXISTS \`${safeName}_migrated\` LIKE \`${safeName}\``);
    }
    // For cross-DB migrations, table must already exist on destination
  } catch (err) {
    logger.warn(`Could not auto-create table ${safeName}: ${err.message}`);
  }
};

/**
 * Inserts a batch of rows into a destination table
 */
const insertBatch = async ({ conn, type }, tableName, rows) => {
  if (!rows || rows.length === 0) return 0;
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const columns = Object.keys(rows[0]);

  if (type === 'mysql') {
    const placeholders = rows.map(() => `(${columns.map(() => '?').join(',')})`).join(',');
    const values = rows.flatMap((row) => columns.map((col) => row[col]));
    const colStr = columns.map((c) => `\`${c}\``).join(',');
    await conn.query(
      `INSERT INTO \`${safeName}\` (${colStr}) VALUES ${placeholders} ON DUPLICATE KEY UPDATE ${columns.map((c) => `\`${c}\`=VALUES(\`${c}\`)`).join(',')}`,
      values
    );
  } else {
    // PostgreSQL bulk insert using UNNEST or multi-row VALUES
    const colStr = columns.map((c) => `"${c}"`).join(',');
    let paramIdx = 1;
    const valuePlaceholders = rows.map((row) => {
      const ph = columns.map(() => `$${paramIdx++}`).join(',');
      return `(${ph})`;
    }).join(',');
    const values = rows.flatMap((row) => columns.map((col) => row[col]));
    await conn.query(
      `INSERT INTO "${safeName}" (${colStr}) VALUES ${valuePlaceholders} ON CONFLICT DO NOTHING`,
      values
    );
  }
  return rows.length;
};

/**
 * Closes a connection
 */
const closeConnection = async ({ conn, type }) => {
  try {
    if (type === 'mysql') {
      await conn.end();
    } else {
      await conn.end();
    }
  } catch (err) {
    logger.warn('Error closing connection:', err.message);
  }
};

module.exports = { createConnection, getTables, getTableCount, getTableSchema, fetchBatch, insertBatch, closeConnection };
