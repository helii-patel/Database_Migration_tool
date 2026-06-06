const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const seed = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected. Syncing models...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Models synced.');

    const { User } = require('../models');

    // Create default admin user
    const existingAdmin = await User.findOne({ where: { email: 'admin@demo.com' } });
    if (!existingAdmin) {
      const hash = await bcrypt.hash('Admin@123', 12);
      await User.create({
        id: uuidv4(),
        username: 'admin',
        email: 'admin@demo.com',
        password_hash: hash,
        role: 'admin',
        is_active: true,
      });
      console.log('✅ Admin user created: admin@demo.com / Admin@123');
    } else {
      console.log('ℹ️  Admin user already exists.');
    }

    // Create demo engineer user
    const existingEng = await User.findOne({ where: { email: 'engineer@demo.com' } });
    if (!existingEng) {
      const hash = await bcrypt.hash('Eng@123', 12);
      await User.create({
        id: uuidv4(),
        username: 'dbEngineer',
        email: 'engineer@demo.com',
        password_hash: hash,
        role: 'engineer',
        is_active: true,
      });
      console.log('✅ Engineer user created: engineer@demo.com / Eng@123');
    }

    console.log('\n🚀 Database initialized successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin:    admin@demo.com / Admin@123');
    console.log('  Engineer: engineer@demo.com / Eng@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Init failed:', error.message);
    process.exit(1);
  }
};

seed();
