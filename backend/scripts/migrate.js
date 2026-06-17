const path = require('path');
const fs = require('fs');
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize, connectDB, createConnection } = require('../src/config/db');
const migrationsPath = path.join(__dirname, '..', 'migrations');

const migrationSequelize =
  process.env.DIRECT_URL && process.env.DIRECT_URL !== process.env.DATABASE_URL
    ? createConnection(process.env.DIRECT_URL, { dialect: 'postgres' })
    : sequelize;

// Use a glob relative to the backend working directory so Umzug can discover migrations
const umzug = new Umzug({
  migrations: { glob: 'migrations/*.js' },
  context: migrationSequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize: migrationSequelize, tableName: 'migrations' }),
  logger: console,
});

async function ensureDb() {
  if (migrationSequelize !== sequelize) {
    await migrationSequelize.authenticate();
  } else {
    await connectDB();
  }
}

async function runUp() {
  await ensureDb();
  const executed = await umzug.up();
  console.log(`Applied ${executed.length} migrations.`);
  process.exit(0);
}

async function runDown() {
  await ensureDb();
  const executed = await umzug.down();
  console.log(`Reverted ${executed.length} migrations.`);
  process.exit(0);
}

async function status() {
  await ensureDb();
  const pending = await umzug.pending();
  const executed = await umzug.executed();
  console.log('Executed migrations:');
  executed.forEach(m => console.log('  ', m.name));
  console.log('\nPending migrations:');
  pending.forEach(m => console.log('  ', m.name));
  process.exit(0);
}

async function create(name) {
  if (!name) {
    console.error('Please provide a name for the migration: migrate:create <name>');
    process.exit(1);
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${ts}-${name}.js`;
  const filePath = path.join(migrationsPath, fileName);
  const template = `module.exports = {
  up: async ({ context: queryInterface }) => {
    // TODO: implement migration up
  },

  down: async ({ context: queryInterface }) => {
    // TODO: implement migration down
  },
};
`;
  fs.writeFileSync(filePath, template, { encoding: 'utf8' });
  console.log('Created migration:', filePath);
  process.exit(0);
}

(async () => {
  const cmd = process.argv[2];
  const arg = process.argv[3];
  try {
    if (cmd === 'up') await runUp();
    else if (cmd === 'down') await runDown();
    else if (cmd === 'status') await status();
    else if (cmd === 'create') await create(arg);
    else {
      console.log('Usage: migrate.js <up|down|status|create> [name]');
      process.exit(0);
    }
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
})();
