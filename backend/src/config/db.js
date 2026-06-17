const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;
const useSqlite = process.env.USE_SQLITE === 'true' || process.env.SYSTEM_DB_DIALECT === 'sqlite';
const databaseUrl = process.env.DATABASE_URL;

const buildSequelizeOptions = (baseOptions = {}) => ({
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
  dialectOptions:
    process.env.DB_SSL === 'true'
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : undefined,
  ...baseOptions,
});

if (useSqlite) {
  const storage = process.env.SQLITE_STORAGE || path.join(__dirname, '../../data/system.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    ...buildSequelizeOptions(),
  });
} else if (databaseUrl) {
  sequelize = new Sequelize(databaseUrl, buildSequelizeOptions({ dialect: 'postgres' }));
} else {
  sequelize = new Sequelize(
    process.env.SYSTEM_DB_NAME || 'dbmigrate_system',
    process.env.SYSTEM_DB_USER || 'root',
    process.env.SYSTEM_DB_PASSWORD || '',
    buildSequelizeOptions({
      host: process.env.SYSTEM_DB_HOST || 'localhost',
      port: parseInt(process.env.SYSTEM_DB_PORT) || 3306,
      dialect: process.env.SYSTEM_DB_DIALECT || 'mysql',
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    })
  );
}

const createConnection = (connectionString, options = {}) =>
  new Sequelize(connectionString, buildSequelizeOptions(options));

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ System database connected successfully.');
    // Use plain sync() to avoid destructive ALTER/backup operations during local dev
    await sequelize.sync();
    console.log('✅ Database models synchronized.');
  } catch (error) {
    console.error('❌ Unable to connect to system database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB, createConnection };
