# Migrator Reference Notes

Local reference repository:

`C:\Documents\7th_sem_internship\Project\.reference\migrator`

Source:

`https://github.com/helii-patel/migrator`

The repository contains the Apache-2.0-licensed SQLines C++ migration and SQL conversion engine.
It is a design reference and is not compiled into this Node.js application.

## Patterns To Reuse

1. Read source metadata before starting data transfer.
2. Create tables and identity/sequence support before loading rows.
3. Load table data before creating secondary indexes and foreign keys.
4. Track rows read, rows written, bytes written, and read/write duration independently.
5. Keep source-to-target object and datatype mapping explicit.
6. Use native bulk loaders as optional database-adapter strategies:
   PostgreSQL `COPY` and MySQL `LOAD DATA`.
7. Validate row counts after transfer and report DDL failures separately from data failures.

## Current Project Mapping

- `backend/src/services/dbAdapter.js` owns database-specific connection, schema, and write logic.
- `backend/src/services/migrationService.js` owns migration planning, progress, and job status.
- User source and destination credentials remain dynamic and encrypted in the application database.
- The local SQLines checkout must remain a reference only; do not commit its source or binaries.

## Recommended Next Engine Stage

Extend source metadata collection to include unique constraints, secondary indexes, and foreign keys.
Create those objects after all selected tables have loaded successfully. Native bulk loading should be
added behind the adapter interface so the existing transactional insert path remains available as a
portable fallback.
