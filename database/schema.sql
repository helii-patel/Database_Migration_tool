-- ============================================================
-- DBMigrate Pro - System Database Schema
-- Run this on your MySQL 8+ instance before starting the app
-- ============================================================

CREATE DATABASE IF NOT EXISTS dbmigrate_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dbmigrate_system;

-- ----------------------------
-- Table: users
-- ----------------------------
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  username      VARCHAR(50)   NOT NULL UNIQUE,
  email         VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('admin','engineer','viewer') NOT NULL DEFAULT 'viewer',
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  last_login    DATETIME,
  avatar_url    VARCHAR(500),
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ----------------------------
-- Table: database_connections
-- ----------------------------
CREATE TABLE IF NOT EXISTS database_connections (
  id                 CHAR(36)     NOT NULL PRIMARY KEY,
  name               VARCHAR(100) NOT NULL,
  db_type            ENUM('mysql','postgresql') NOT NULL,
  host               VARCHAR(255) NOT NULL,
  port               INT          NOT NULL,
  database_name      VARCHAR(255) NOT NULL,
  username           VARCHAR(100) NOT NULL,
  encrypted_password TEXT         NOT NULL,
  ssl_enabled        TINYINT(1)   NOT NULL DEFAULT 0,
  status             ENUM('unknown','connected','failed') NOT NULL DEFAULT 'unknown',
  last_tested_at     DATETIME,
  description        TEXT,
  tags               JSON,
  created_by         CHAR(36)     NOT NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_connections_created_by (created_by),
  INDEX idx_connections_status (status),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- Table: migration_jobs
-- ----------------------------
CREATE TABLE IF NOT EXISTS migration_jobs (
  id                       CHAR(36)      NOT NULL PRIMARY KEY,
  name                     VARCHAR(200)  NOT NULL,
  source_connection_id     CHAR(36)      NOT NULL,
  destination_connection_id CHAR(36)     NOT NULL,
  tables                   JSON          NOT NULL,
  migration_type           ENUM('full','incremental') NOT NULL DEFAULT 'full',
  status                   ENUM('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  progress                 FLOAT         NOT NULL DEFAULT 0,
  total_records            BIGINT        NOT NULL DEFAULT 0,
  migrated_records         BIGINT        NOT NULL DEFAULT 0,
  failed_records           BIGINT        NOT NULL DEFAULT 0,
  started_at               DATETIME,
  completed_at             DATETIME,
  error_message            TEXT,
  scheduled_at             DATETIME,
  options                  JSON,
  created_by               CHAR(36)      NOT NULL,
  created_at               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_created_by (created_by),
  INDEX idx_jobs_created_at (created_at),
  INDEX idx_jobs_scheduled_at (scheduled_at),
  FOREIGN KEY (source_connection_id)      REFERENCES database_connections(id) ON DELETE RESTRICT,
  FOREIGN KEY (destination_connection_id) REFERENCES database_connections(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by)                REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- Table: migration_logs
-- ----------------------------
CREATE TABLE IF NOT EXISTS migration_logs (
  id               CHAR(36)     NOT NULL PRIMARY KEY,
  job_id           CHAR(36)     NOT NULL,
  table_name       VARCHAR(200) NOT NULL,
  event_type       ENUM('info','warning','error','success','progress') NOT NULL DEFAULT 'info',
  records_migrated BIGINT       NOT NULL DEFAULT 0,
  records_failed   BIGINT       NOT NULL DEFAULT 0,
  message          TEXT,
  batch_number     INT          NOT NULL DEFAULT 0,
  duration_ms      INT,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mlogs_job_id (job_id),
  INDEX idx_mlogs_event_type (event_type),
  INDEX idx_mlogs_table_name (table_name),
  FOREIGN KEY (job_id) REFERENCES migration_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- Table: validation_reports
-- ----------------------------
CREATE TABLE IF NOT EXISTS validation_reports (
  id                  CHAR(36)     NOT NULL PRIMARY KEY,
  job_id              CHAR(36)     NOT NULL,
  table_name          VARCHAR(200) NOT NULL,
  source_count        BIGINT       NOT NULL DEFAULT 0,
  destination_count   BIGINT       NOT NULL DEFAULT 0,
  missing_records     BIGINT       NOT NULL DEFAULT 0,
  duplicate_records   BIGINT       NOT NULL DEFAULT 0,
  extra_records       BIGINT       NOT NULL DEFAULT 0,
  status              ENUM('passed','failed','warning','pending') NOT NULL DEFAULT 'pending',
  checksum_match      TINYINT(1),
  validated_at        DATETIME,
  details             JSON,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vreports_job_id (job_id),
  INDEX idx_vreports_status (status),
  FOREIGN KEY (job_id) REFERENCES migration_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- Table: performance_snapshots
-- ----------------------------
CREATE TABLE IF NOT EXISTS performance_snapshots (
  id                    CHAR(36)     NOT NULL PRIMARY KEY,
  connection_id         CHAR(36)     NOT NULL,
  cpu_usage             FLOAT        NOT NULL DEFAULT 0,
  memory_usage          FLOAT        NOT NULL DEFAULT 0,
  memory_total_mb       FLOAT        NOT NULL DEFAULT 0,
  memory_used_mb        FLOAT        NOT NULL DEFAULT 0,
  active_connections    INT          NOT NULL DEFAULT 0,
  max_connections       INT          NOT NULL DEFAULT 0,
  transactions_per_second FLOAT      NOT NULL DEFAULT 0,
  queries_per_second    FLOAT        NOT NULL DEFAULT 0,
  slow_queries          INT          NOT NULL DEFAULT 0,
  avg_query_time_ms     FLOAT        NOT NULL DEFAULT 0,
  buffer_hit_ratio      FLOAT        NOT NULL DEFAULT 0,
  disk_reads            BIGINT       NOT NULL DEFAULT 0,
  cache_reads           BIGINT       NOT NULL DEFAULT 0,
  uptime_seconds        BIGINT       NOT NULL DEFAULT 0,
  captured_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_snapshots_conn_id (connection_id),
  INDEX idx_snapshots_captured_at (captured_at),
  FOREIGN KEY (connection_id) REFERENCES database_connections(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- Table: audit_logs
-- ----------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  user_id       CHAR(36),
  username      VARCHAR(50),
  action        VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id   VARCHAR(100),
  details       JSON,
  ip_address    VARCHAR(45),
  user_agent    VARCHAR(500),
  status        ENUM('success','failure') NOT NULL DEFAULT 'success',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_alogs_user_id (user_id),
  INDEX idx_alogs_action (action),
  INDEX idx_alogs_created_at (created_at),
  INDEX idx_alogs_status (status)
) ENGINE=InnoDB;

-- ----------------------------
-- Table: notifications
-- ----------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  user_id       CHAR(36)     NOT NULL,
  type          ENUM('migration_complete','migration_failed','performance_alert','validation_complete','system') NOT NULL DEFAULT 'system',
  title         VARCHAR(200) NOT NULL,
  message       TEXT         NOT NULL,
  is_read       TINYINT(1)   NOT NULL DEFAULT 0,
  resource_type VARCHAR(50),
  resource_id   VARCHAR(100),
  severity      ENUM('info','warning','error','success') NOT NULL DEFAULT 'info',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_notifs_user_id (user_id),
  INDEX idx_notifs_is_read (is_read),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- Seed: Default admin user
-- Password: Admin@123
-- ----------------------------
INSERT IGNORE INTO users (id, username, email, password_hash, role, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin',
  'admin@demo.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQBNbqQy',
  'admin',
  1
);
