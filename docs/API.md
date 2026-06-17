# DBMigrate Pro — API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Authentication

### POST `/auth/register`
Register a new user.

**Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "MyPass@123",
  "role": "engineer"
}
```
**Response `201`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbG...",
    "user": { "id": "uuid", "username": "johndoe", "email": "...", "role": "engineer" }
  }
}
```

---

### POST `/auth/login`
Login and receive JWT.

**Body:**
```json
{ "email": "admin@demo.com", "password": "Admin@123" }
```
**Response `200`:**
```json
{
  "success": true,
  "data": { "token": "eyJhbG...", "user": { ... } }
}
```

---

### GET `/auth/me` 🔒
Get current user info.

**Response `200`:**
```json
{ "success": true, "data": { "id": "...", "username": "admin", "role": "admin", ... } }
```

---

### PUT `/auth/profile` 🔒
Update profile or change password.

**Body:**
```json
{ "username": "newname", "currentPassword": "old", "newPassword": "new123" }
```

---

## Database Connections

### GET `/connections` 🔒
List all connections (admin sees all, others see their own).

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production MySQL",
      "db_type": "mysql",
      "host": "db.example.com",
      "port": 3306,
      "database_name": "prod_db",
      "username": "root",
      "ssl_enabled": false,
      "status": "connected",
      "last_tested_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

---

### POST `/connections` 🔒 (admin, engineer)
Create a new DB connection.

**Body:**
```json
{
  "name": "Staging PostgreSQL",
  "db_type": "postgresql",
  "host": "staging.example.com",
  "port": 5432,
  "database_name": "staging_db",
  "username": "postgres",
  "password": "secret",
  "ssl_enabled": true,
  "description": "Staging environment"
}
```
**Response `201`:** Created connection object (password omitted).

---

### POST `/connections/:id/test` 🔒
Test live connectivity.

**Response `200` (success):**
```json
{ "success": true, "message": "Connection successful", "data": { "table_count": 42 } }
```
**Response `200` (fail):**
```json
{ "success": false, "message": "Connection failed: ECONNREFUSED" }
```

---

### GET `/connections/:id/tables` 🔒
List available tables.

**Response `200`:**
```json
{ "success": true, "data": ["users", "orders", "products"] }
```

---

### PUT `/connections/:id` 🔒 (admin, engineer)
Update a connection.

### DELETE `/connections/:id` 🔒 (admin, engineer)
Delete a connection.

---

## Migrations

### GET `/migrations` 🔒
List all migration jobs.

**Query params:** `status`, `page`, `limit`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Prod → Staging",
      "status": "completed",
      "progress": 100,
      "migrated_records": 50000,
      "total_records": 50000,
      "migration_type": "full",
      "started_at": "2024-01-01T10:00:00Z",
      "completed_at": "2024-01-01T10:05:30Z",
      "sourceConnection": { "name": "Production MySQL" },
      "destinationConnection": { "name": "Staging PostgreSQL" }
    }
  ]
}
```

---

### POST `/migrations` 🔒 (admin, engineer)
Create and start a migration job.

**Body:**
```json
{
  "name": "Weekly Migration",
  "source_connection_id": "uuid",
  "destination_connection_id": "uuid",
  "tables": ["users", "orders", "products"],
  "migration_type": "full",
  "scheduled_at": null,
  "options": {
    "create_missing_tables": true,
    "existing_data_strategy": "fail",
    "continue_on_error": false
  }
}
```
**Response `201`:** Created job object. Starts immediately if `scheduled_at` is null.

`existing_data_strategy` accepts:

- `fail` (default): stop before changing a non-empty destination table.
- `skip`: insert new primary-key values and skip conflicts.
- `truncate`: delete existing destination rows before copying.

Source and destination credentials are entered through the connection API and encrypted in the
application database. They are not configured as `SOURCE_DB_URL` or `TARGET_DB_URL` environment
variables. Environment variables are reserved for application infrastructure such as the system
database, JWT secret, and credential-encryption key.

---

### GET `/migrations/:id` 🔒
Get job details with logs (last 200).

### POST `/migrations/:id/cancel` 🔒 (admin, engineer)
Cancel a running job.

### POST `/migrations/:id/retry` 🔒 (admin, engineer)
Retry a failed job (creates new job).

### GET `/migrations/:id/logs` 🔒
Get full migration event log.

### POST `/migrations/:id/validate` 🔒
Trigger data validation for a completed migration.

---

## Performance Monitoring

### GET `/monitoring/:connId/metrics` 🔒
Fetch and return current live metrics (also stores snapshot).

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "cpu_usage": 23.5,
    "memory_usage": 67.2,
    "memory_used_mb": 682,
    "memory_total_mb": 1024,
    "active_connections": 12,
    "max_connections": 151,
    "queries_per_second": 45.3,
    "transactions_per_second": 12.1,
    "slow_queries": 2,
    "avg_query_time_ms": 4.5,
    "buffer_hit_ratio": 97.8,
    "uptime_seconds": 864000,
    "captured_at": "2024-01-01T12:00:00Z"
  }
}
```

---

### GET `/monitoring/:connId/history?minutes=30` 🔒
Get historical metric snapshots.

**Query params:** `minutes` (default: 30, max: 1440)

---

### GET `/monitoring/:connId/slow-queries` 🔒
Get snapshots where `slow_queries > 0`.

---

## Analytics

### GET `/analytics/overview` 🔒
Get dashboard KPIs and trend data.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalMigrations": 24,
      "completedMigrations": 20,
      "failedMigrations": 2,
      "runningMigrations": 1,
      "successRate": 91,
      "totalConnections": 5,
      "totalRecordsMigrated": 2500000,
      "validationRate": 95,
      "healthScore": 87
    },
    "trends": [
      { "date": "2024-01-01", "completed": 3, "failed": 0, "total": 3 },
      { "date": "2024-01-02", "completed": 2, "failed": 1, "total": 3 }
    ]
  }
}
```

---

## Audit Logs

### GET `/logs` 🔒
Get audit logs with filtering.

**Query params:** `page`, `limit`, `search`, `action`, `user_id`, `status`, `startDate`, `endDate`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "logs": [ { "id": "...", "username": "admin", "action": "MIGRATION_CREATED", "status": "success", ... } ],
    "total": 150,
    "page": 1,
    "totalPages": 8
  }
}
```

### GET `/logs/export` 🔒
Download audit logs as CSV file.

---

## Notifications

### GET `/notifications` 🔒
Get user notifications.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "notifications": [ { "id": "...", "type": "migration_complete", "title": "...", "is_read": false, ... } ],
    "unreadCount": 3
  }
}
```

### PUT `/notifications/:id/read` 🔒
Mark single notification as read.

### PUT `/notifications/read-all` 🔒
Mark all notifications as read.

### DELETE `/notifications/:id` 🔒
Delete a notification.

---

## Error Responses

All errors follow this format:

```json
{ "success": false, "message": "Human-readable error message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate entry) |
| 429 | Rate limit exceeded (500 req/15 min) |
| 500 | Internal server error |

---

## WebSocket Events (Socket.IO)

Connect to `ws://localhost:5000` with Socket.IO client.

### Emit Events (client → server)
| Event | Payload | Description |
|-------|---------|-------------|
| `join_job` | `jobId` | Subscribe to migration job events |
| `leave_job` | `jobId` | Unsubscribe |
| `monitor_connection` | `connId` | Subscribe to live metrics |

### Receive Events (server → client)
| Event | Payload | Description |
|-------|---------|-------------|
| `progress` | `{ jobId, progress, tableName, migratedRecords, totalRecords }` | Migration progress update |
| `table_start` | `{ jobId, tableName, tableTotal }` | Table migration started |
| `table_complete` | `{ jobId, tableName, tableMigrated }` | Table migration done |
| `table_error` | `{ jobId, tableName, error }` | Table migration failed |
| `job_status` | `{ jobId, status, migratedRecords, totalRecords }` | Job status changed |
| `metrics` | `{ connectionId, cpu_usage, memory_usage, ... }` | Live DB metrics |
