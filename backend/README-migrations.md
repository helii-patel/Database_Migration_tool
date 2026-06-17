# Migrations & Seeders

This project includes a simple migration and seeder system inspired by Phinx, implemented using `umzug` and Sequelize.

Location

- Migrations: `backend/migrations/*.js`
- Seeders: `backend/seeders/*.js`
- Runner scripts: `backend/scripts/migrate.js`, `backend/scripts/seed.js`

Usage (local development with SQLite)

```powershell
$Env:USE_SQLITE='true'; cd backend
# show migration status
npm run migrate:status
# apply migrations
npm run migrate:up
# revert last migration
npm run migrate:down

# show seeder status
npm run seed:status
# apply seeders
npm run seed:up
# revert last seeder
npm run seed:down

# create a new migration/seeder file
npm run migrate:create -- descriptive-name
npm run seed:create -- initial-data
```

Notes

- Runners use your configured system database. For local development we recommend `USE_SQLITE=true` (the project already has a SQLite fallback).
- Migration and seeder templates are created with `create` commands; edit the generated file to implement `up`/`down` logic.
- The runners store applied filenames in `migrations` and `seeders` tables respectively.
