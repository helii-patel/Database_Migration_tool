const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.SYSTEM_DB_NAME || 'dbmigrate_system',
  process.env.SYSTEM_DB_USER || 'root',
  process.env.SYSTEM_DB_PASSWORD || '',
  {
    host: process.env.SYSTEM_DB_HOST || 'localhost',
    port: parseInt(process.env.SYSTEM_DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ System database connected successfully.');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database models synchronized.');
  } catch (error) {
    console.error('❌ Unable to connect to system database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
