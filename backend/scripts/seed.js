const path = require('path');
const fs = require('fs');
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize, connectDB, createConnection } = require('../src/config/db');
const seedersPath = path.join(__dirname, '..', 'seeders');

const seederSequelize =
  process.env.DIRECT_URL && process.env.DIRECT_URL !== process.env.DATABASE_URL
    ? createConnection(process.env.DIRECT_URL, { dialect: 'postgres' })
    : sequelize;

const umzug = new Umzug({
  migrations: { glob: 'seeders/*.js' },
  context: seederSequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize: seederSequelize, tableName: 'seeders' }),
  logger: console,
});

async function ensureDb() {
  if (seederSequelize !== sequelize) {
    await seederSequelize.authenticate();
  } else {
    await connectDB();
  }
}

async function runUp() {
  await ensureDb();
  const executed = await umzug.up();
  console.log(`Applied ${executed.length} seeders.`);
  process.exit(0);
}

async function runDown() {
  await ensureDb();
  const executed = await umzug.down();
  console.log(`Reverted ${executed.length} seeders.`);
  process.exit(0);
}

async function status() {
  await ensureDb();
  const pending = await umzug.pending();
  const executed = await umzug.executed();
  console.log('Executed seeders:');
  executed.forEach(m => console.log('  ', m.name));
  console.log('\nPending seeders:');
  pending.forEach(m => console.log('  ', m.name));
  process.exit(0);
}

async function create(name) {
  if (!name) {
    console.error('Please provide a name for the seeder: seed:create <name>');
    process.exit(1);
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${ts}-${name}.js`;
  const filePath = path.join(seedersPath, fileName);
  const template = `module.exports = {
  up: async ({ context: queryInterface }) => {
    // TODO: implement seed up (insert rows)
  },

  down: async ({ context: queryInterface }) => {
    // TODO: implement seed down (delete rows)
  },
};
`;
  fs.writeFileSync(filePath, template, { encoding: 'utf8' });
  console.log('Created seeder:', filePath);
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
      console.log('Usage: seed.js <up|down|status|create> [name]');
      process.exit(0);
    }
  } catch (err) {
    console.error('Seeder error:', err);
    process.exit(1);
  }
})();
