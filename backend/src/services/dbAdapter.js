const mysql = require('mysql2/promise');
const { Client } = require('pg');
const { decrypt } = require('../config/encryption');
const logger = require('../utils/logger');

const SUPPORTED_DATABASES = new Set(['mysql', 'postgresql']);

const isSupabaseHost = (host) => {
  const normalizedHost = String(host || '').trim().toLowerCase();
  return (
    normalizedHost.endsWith('.supabase.co') ||
    normalizedHost.endsWith('.pooler.supabase.com') ||
    normalizedHost.includes('supabase')
  );
};

const quoteIdentifier = (type, identifier) => {
  if (typeof identifier !== 'string' || !identifier.trim() || identifier.includes('\0')) {
    throw new Error('Invalid database identifier');
  }
  return type === 'mysql'
    ? `\`${identifier.replace(/`/g, '``')}\``
    : `"${identifier.replace(/"/g, '""')}"`;
};

const normalizeConnectionConfig = (connectionConfig) => {
  const config = connectionConfig.toJSON ? connectionConfig.toJSON() : connectionConfig;
  if (!SUPPORTED_DATABASES.has(config.db_type)) {
    throw new Error(`Unsupported database type: ${config.db_type}`);
  }
  return {
    type: config.db_type,
    host: String(config.host || '').trim(),
    port: Number(config.port),
    user: String(config.username || '').trim(),
    password:
      config.password !== undefined ? config.password : decrypt(config.encrypted_password) || '',
    database: String(config.database_name || '').trim(),
    ssl:
      config.ssl_enabled || (config.db_type === 'postgresql' && isSupabaseHost(config.host))
        ? { rejectUnauthorized: false }
        : false,
  };
};

const createConnection = async (connectionConfig) => {
  const config = normalizeConnectionConfig(connectionConfig);
  if (!config.host || !config.port || !config.user || !config.database) {
    throw new Error('Host, port, database, and username are required');
  }

  if (config.type === 'mysql') {
    const conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl,
      connectTimeout: 10000,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });
    return { conn, type: 'mysql' };
  }

  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl,
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  return { conn: client, type: 'postgresql' };
};

const getTables = async ({ conn, type }) => {
  if (type === 'mysql') {
    const [rows] = await conn.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    return rows.map((row) => row.TABLE_NAME || row.table_name);
  }
  const res = await conn.query(
    `SELECT tablename FROM pg_catalog.pg_tables
     WHERE schemaname = 'public' ORDER BY tablename`
  );
  return res.rows.map((row) => row.tablename);
};

const tableExists = async ({ conn, type }, tableName) => {
  if (type === 'mysql') {
    const [rows] = await conn.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
      [tableName]
    );
    return rows.length > 0;
  }
  const res = await conn.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1 LIMIT 1`,
    [tableName]
  );
  return res.rowCount > 0;
};

const getTableCount = async ({ conn, type }, tableName) => {
  const table = quoteIdentifier(type, tableName);
  if (type === 'mysql') {
    const [rows] = await conn.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
    return Number(rows[0].cnt);
  }
  const res = await conn.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
  return Number(res.rows[0].cnt);
};

const getTableSchema = async ({ conn, type }, tableName) => {
  if (type === 'mysql') {
    const [rows] = await conn.query(
      `SELECT column_name, data_type, column_type, is_nullable, column_key, column_default,
              extra, character_maximum_length, numeric_precision, numeric_scale
       FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = ?
       ORDER BY ordinal_position`,
      [tableName]
    );
    return rows.map((row) => ({
      name: row.COLUMN_NAME || row.column_name,
      dataType: String(row.DATA_TYPE || row.data_type).toLowerCase(),
      nativeType: row.COLUMN_TYPE || row.column_type,
      nullable: (row.IS_NULLABLE || row.is_nullable) === 'YES',
      primaryKey: (row.COLUMN_KEY || row.column_key) === 'PRI',
      autoIncrement: String(row.EXTRA || row.extra || '').includes('auto_increment'),
      characterMaximumLength: row.CHARACTER_MAXIMUM_LENGTH || row.character_maximum_length,
      numericPrecision: row.NUMERIC_PRECISION || row.numeric_precision,
      numericScale: row.NUMERIC_SCALE ?? row.numeric_scale,
    }));
  }

  const res = await conn.query(
    `SELECT c.column_name, c.data_type, c.udt_name, c.is_nullable, c.column_default,
            c.character_maximum_length, c.numeric_precision, c.numeric_scale,
            EXISTS (
              SELECT 1
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
               AND tc.table_schema = kcu.table_schema
              WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = c.table_schema
                AND tc.table_name = c.table_name
                AND kcu.column_name = c.column_name
            ) AS primary_key
     FROM information_schema.columns c
     WHERE c.table_schema = 'public' AND c.table_name = $1
     ORDER BY c.ordinal_position`,
    [tableName]
  );
  return res.rows.map((row) => ({
    name: row.column_name,
    dataType: String(row.data_type).toLowerCase(),
    nativeType: row.udt_name,
    nullable: row.is_nullable === 'YES',
    primaryKey: row.primary_key,
    autoIncrement: String(row.column_default || '').startsWith('nextval('),
    defaultValue: row.column_default,
    characterMaximumLength: row.character_maximum_length,
    numericPrecision: row.numeric_precision,
    numericScale: row.numeric_scale,
  }));
};

const getUniqueConstraints = async ({ conn, type }, tableName) => {
  if (type === 'mysql') {
    const [rows] = await conn.query(
      `SELECT index_name, column_name, non_unique
       FROM information_schema.statistics
       WHERE table_schema = DATABASE() AND table_name = ?
       ORDER BY index_name, seq_in_index`,
      [tableName]
    );
    const byIndex = new Map();
    for (const row of rows) {
      if (Number(row.NON_UNIQUE ?? row.non_unique) !== 0) continue;
      const indexName = row.INDEX_NAME || row.index_name;
      if (indexName === 'PRIMARY') continue;
      if (!byIndex.has(indexName)) byIndex.set(indexName, []);
      byIndex.get(indexName).push(row.COLUMN_NAME || row.column_name);
    }
    return [...byIndex.values()].filter((columns) => columns.length > 0);
  }

  const res = await conn.query(
    `SELECT tc.constraint_name, kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
     WHERE tc.table_schema = 'public'
       AND tc.table_name = $1
       AND tc.constraint_type = 'UNIQUE'
     ORDER BY tc.constraint_name, kcu.ordinal_position`,
    [tableName]
  );
  const byConstraint = new Map();
  for (const row of res.rows) {
    if (!byConstraint.has(row.constraint_name)) byConstraint.set(row.constraint_name, []);
    byConstraint.get(row.constraint_name).push(row.column_name);
  }
  return [...byConstraint.values()].filter((columns) => columns.length > 0);
};

const getForeignKeys = async ({ conn, type }, tableName) => {
  if (type === 'mysql') {
    const [rows] = await conn.query(
      `SELECT kcu.column_name, kcu.referenced_table_name, kcu.referenced_column_name
       FROM information_schema.key_column_usage kcu
       JOIN information_schema.table_constraints tc
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema = DATABASE()
         AND tc.table_name = ?
         AND tc.constraint_type = 'FOREIGN KEY'
       ORDER BY kcu.ordinal_position`,
      [tableName]
    );
    return rows.map((row) => ({
      column: row.COLUMN_NAME || row.column_name,
      referencesTable: row.REFERENCED_TABLE_NAME || row.referenced_table_name,
      referencesColumn: row.REFERENCED_COLUMN_NAME || row.referenced_column_name,
    }));
  }

  const res = await conn.query(
    `SELECT kcu.column_name, ccu.table_name AS referenced_table_name, ccu.column_name AS referenced_column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage ccu
       ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
     WHERE tc.table_schema = 'public'
       AND tc.table_name = $1
       AND tc.constraint_type = 'FOREIGN KEY'
     ORDER BY tc.constraint_name, kcu.ordinal_position`,
    [tableName]
  );
  return res.rows.map((row) => ({
    column: row.column_name,
    referencesTable: row.referenced_table_name,
    referencesColumn: row.referenced_column_name,
  }));
};

const toPostgresType = (column) => {
  const type = column.dataType;
  if (['boolean', 'bool'].includes(type) || (type === 'tinyint' && column.nativeType === 'tinyint(1)'))
    return 'BOOLEAN';
  if (column.autoIncrement && ['tinyint', 'smallint'].includes(type)) return 'SMALLSERIAL';
  if (column.autoIncrement && ['int', 'integer', 'mediumint'].includes(type)) return 'SERIAL';
  if (column.autoIncrement && type === 'bigint') return 'BIGSERIAL';
  if (['tinyint', 'smallint'].includes(type)) return 'SMALLINT';
  if (['int', 'integer', 'mediumint'].includes(type)) return 'INTEGER';
  if (type === 'bigint') return 'BIGINT';
  if (['decimal', 'numeric'].includes(type)) {
    return column.numericPrecision
      ? `NUMERIC(${column.numericPrecision},${column.numericScale || 0})`
      : 'NUMERIC';
  }
  if (['float', 'real'].includes(type)) return 'REAL';
  if (['double', 'double precision'].includes(type)) return 'DOUBLE PRECISION';
  if (type === 'date') return 'DATE';
  if (['datetime', 'timestamp without time zone'].includes(type)) return 'TIMESTAMP';
  if (['timestamp', 'timestamp with time zone'].includes(type)) return 'TIMESTAMPTZ';
  if (['time', 'time without time zone'].includes(type)) return 'TIME';
  if (['json', 'jsonb'].includes(type)) return 'JSONB';
  if (['binary', 'varbinary', 'blob', 'tinyblob', 'mediumblob', 'longblob', 'bytea'].includes(type))
    return 'BYTEA';
  if (type === 'uuid') return 'UUID';
  if (['char', 'character'].includes(type)) return `CHAR(${column.characterMaximumLength || 1})`;
  if (['varchar', 'character varying'].includes(type) && column.characterMaximumLength)
    return `VARCHAR(${column.characterMaximumLength})`;
  return 'TEXT';
};

const toMysqlType = (column) => {
  const type = column.dataType;
  if (type === 'smallint') return 'SMALLINT';
  if (['integer', 'int', 'serial'].includes(type)) return 'INT';
  if (['bigint', 'bigserial'].includes(type)) return 'BIGINT';
  if (['decimal', 'numeric'].includes(type)) {
    return column.numericPrecision
      ? `DECIMAL(${column.numericPrecision},${column.numericScale || 0})`
      : 'DECIMAL(65,30)';
  }
  if (['real', 'float'].includes(type)) return 'FLOAT';
  if (['double precision', 'double'].includes(type)) return 'DOUBLE';
  if (['boolean', 'bool'].includes(type)) return 'BOOLEAN';
  if (type === 'date') return 'DATE';
  if (type.includes('timestamp') || type === 'datetime') return 'DATETIME';
  if (type.includes('time')) return 'TIME';
  if (['json', 'jsonb'].includes(type)) return 'JSON';
  if (['bytea', 'binary', 'varbinary'].includes(type) || type.includes('blob')) return 'LONGBLOB';
  if (['char', 'character'].includes(type)) return `CHAR(${column.characterMaximumLength || 1})`;
  if (['varchar', 'character varying'].includes(type) && column.characterMaximumLength)
    return `VARCHAR(${Math.min(column.characterMaximumLength, 65535)})`;
  if (type === 'uuid') return 'CHAR(36)';
  return 'LONGTEXT';
};

const ensureTable = async (destination, tableName, schema, createIfMissing = true) => {
  const exists = await tableExists(destination, tableName);
  if (exists) return false;
  if (!createIfMissing)
    throw new Error(
      `Destination table "${tableName}" does not exist. Enable "create missing destination tables" to create it automatically.`
    );
  if (!schema.length) throw new Error(`Source table "${tableName}" has no columns`);

  const { conn, type } = destination;
  const primaryKeys = schema.filter((column) => column.primaryKey);
  const uniqueConstraints = schema.uniqueConstraints || [];
  const foreignKeys = schema.foreignKeys || [];
  const definitions = schema.map((column) => {
    const sqlType = type === 'mysql' ? toMysqlType(column) : toPostgresType(column);
    const autoIncrement =
      type === 'mysql' && column.autoIncrement && primaryKeys.length === 1 ? ' AUTO_INCREMENT' : '';
    const defaultClause =
      column.defaultValue !== null && column.defaultValue !== undefined && !sqlType.includes('SERIAL')
        ? ` DEFAULT ${column.defaultValue}`
        : '';
    return `${quoteIdentifier(type, column.name)} ${sqlType}${
      column.nullable ? '' : ' NOT NULL'
    }${defaultClause}${autoIncrement}`;
  });
  if (primaryKeys.length) {
    definitions.push(
      `PRIMARY KEY (${primaryKeys
        .map((column) => quoteIdentifier(type, column.name))
        .join(', ')})`
    );
  }
  for (const uniqueGroup of uniqueConstraints) {
    definitions.push(
      `UNIQUE (${uniqueGroup.map((column) => quoteIdentifier(type, column)).join(', ')})`
    );
  }
  // Foreign keys are deferred to avoid dependency issues during table creation
  await conn.query(
    `CREATE TABLE ${quoteIdentifier(type, tableName)} (${definitions.join(', ')})`
  );
  return true;
};

const fetchBatch = async ({ conn, type }, tableName, offset, limit, orderColumns = []) => {
  const table = quoteIdentifier(type, tableName);
  const orderBy = orderColumns.length
    ? ` ORDER BY ${orderColumns.map((column) => quoteIdentifier(type, column)).join(', ')}`
    : '';
  if (type === 'mysql') {
    const [rows] = await conn.query(`SELECT * FROM ${table}${orderBy} LIMIT ? OFFSET ?`, [
      limit,
      offset,
    ]);
    return rows;
  }
  const res = await conn.query(`SELECT * FROM ${table}${orderBy} LIMIT $1 OFFSET $2`, [
    limit,
    offset,
  ]);
  return res.rows;
};

const normalizeValue = (type, column, value) => {
  if (value === null || value === undefined || !column) return value;
  if (
    type === 'postgresql' &&
    column.dataType === 'tinyint' &&
    column.nativeType === 'tinyint(1)'
  ) {
    return Boolean(value);
  }
  if (
    type === 'mysql' &&
    ['json', 'jsonb'].includes(column.dataType) &&
    typeof value === 'object' &&
    !Buffer.isBuffer(value)
  ) {
    return JSON.stringify(value);
  }
  return value;
};

const insertBatch = async (
  { conn, type },
  tableName,
  rows,
  conflictStrategy = 'fail',
  schema = []
) => {
  if (!rows?.length) return 0;
  const table = quoteIdentifier(type, tableName);
  const columns = Object.keys(rows[0]);
  const schemaByName = new Map(schema.map((column) => [column.name, column]));
  const quotedColumns = columns.map((column) => quoteIdentifier(type, column));
  const values = rows.flatMap((row) =>
    columns.map((column) => normalizeValue(type, schemaByName.get(column), row[column]))
  );

  if (type === 'mysql') {
    const placeholders = rows.map(() => `(${columns.map(() => '?').join(',')})`).join(',');
    await conn.beginTransaction();
    try {
      const [result] = await conn.query(
        `${conflictStrategy === 'skip' ? 'INSERT IGNORE' : 'INSERT'} INTO ${table} ` +
          `(${quotedColumns.join(',')}) VALUES ${placeholders}`,
        values
      );
      await conn.commit();
      return result.affectedRows;
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  }

  let parameter = 1;
  const placeholders = rows
    .map(() => `(${columns.map(() => `$${parameter++}`).join(',')})`)
    .join(',');
  await conn.query('BEGIN');
  try {
    const result = await conn.query(
      `INSERT INTO ${table} (${quotedColumns.join(',')}) VALUES ${placeholders}${
        conflictStrategy === 'skip' ? ' ON CONFLICT DO NOTHING' : ''
      }`,
      values
    );
    await conn.query('COMMIT');
    return result.rowCount;
  } catch (error) {
    await conn.query('ROLLBACK');
    throw error;
  }
};

const truncateTable = async ({ conn, type }, tableName) => {
  const table = quoteIdentifier(type, tableName);
  await conn.query(
    type === 'mysql' ? `TRUNCATE TABLE ${table}` : `TRUNCATE TABLE ${table} RESTART IDENTITY`
  );
};

const addForeignKeys = async ({ conn, type }, tableName, foreignKeys) => {
  if (!foreignKeys || !foreignKeys.length) return;
  const table = quoteIdentifier(type, tableName);
  const addConstraints = foreignKeys.map(fk => {
    return `ADD FOREIGN KEY (${quoteIdentifier(type, fk.column)}) REFERENCES ${quoteIdentifier(type, fk.referencesTable)} (${quoteIdentifier(type, fk.referencesColumn)})`;
  });
  
  if (type === 'mysql') {
    for (const add of addConstraints) {
      try {
        await conn.query(`ALTER TABLE ${table} ${add}`);
      } catch (err) {
        logger.warn(`Could not add foreign key to ${tableName}: ${err.message}`);
      }
    }
  } else {
    try {
      await conn.query(`ALTER TABLE ${table} ${addConstraints.join(', ')}`);
    } catch (err) {
      logger.warn(`Could not add foreign keys to ${tableName}: ${err.message}`);
    }
  }
};

const syncGeneratedKeys = async ({ conn, type }, tableName, schema) => {
  if (type !== 'postgresql') return;
  const generatedColumns = schema.filter((column) => column.autoIncrement);
  for (const column of generatedColumns) {
    const sequenceResult = await conn.query('SELECT pg_get_serial_sequence($1, $2) AS sequence', [
      tableName,
      column.name,
    ]);
    const sequence = sequenceResult.rows[0]?.sequence;
    if (!sequence) continue;
    const maxResult = await conn.query(
      `SELECT MAX(${quoteIdentifier(type, column.name)}) AS maximum
       FROM ${quoteIdentifier(type, tableName)}`
    );
    const maximum = maxResult.rows[0]?.maximum;
    await conn.query('SELECT setval($1, $2, $3)', [
      sequence,
      maximum === null ? 1 : maximum,
      maximum !== null,
    ]);
  }
};

const closeConnection = async ({ conn }) => {
  try {
    await conn.end();
  } catch (err) {
    logger.warn(`Error closing connection: ${err.message}`);
  }
};

module.exports = {
  createConnection,
  getTables,
  tableExists,
  getTableCount,
  getTableSchema,
  getUniqueConstraints,
  getForeignKeys,
  ensureTable,
  fetchBatch,
  insertBatch,
  truncateTable,
  addForeignKeys,
  syncGeneratedKeys,
  closeConnection,
};
