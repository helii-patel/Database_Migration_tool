# DBMigrate Pro

> Enterprise-grade Database Migration & Performance Monitoring System

A full-stack web application for database administrators and data engineers to migrate data between MySQL and PostgreSQL databases, monitor real-time performance metrics, validate migrated records, and analyze database health through an interactive dashboard.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![MySQL](https://img.shields.io/badge/MySQL-8+-orange) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Secure login with role-based access (Admin, Engineer, Viewer) |
| 🔌 **Connection Manager** | Add, test, and manage MySQL/PostgreSQL database connections with AES-256 encrypted credentials |
| ⇄ **Migration Engine** | Full and incremental table migrations with batched processing and real-time progress |
| 📊 **Performance Monitoring** | Live metrics (CPU, memory, connections, QPS, slow queries) via Socket.IO |
| ✅ **Data Validation** | Post-migration record count comparison and checksum verification |
| 📋 **Audit Logs** | Full activity history with search, filter, and CSV export |
| 📈 **Analytics Dashboard** | KPI cards, migration trends, system health score (0-100) |
| 🔔 **Notifications** | Real-time alerts for migration completion, failures, and performance thresholds |
| 🌙 **Dark/Light Mode** | Persisted theme preference |
| 📅 **Scheduled Migrations** | Cron-based scheduled job execution |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + Vite
- **Tailwind CSS v3** (custom design system)
- **Recharts** (interactive charts)
- **Socket.IO Client** (real-time events)
- **React Router v6** (SPA routing)
- **React Hot Toast** (notifications)
- **date-fns** (date formatting)
- **Axios** (HTTP client)

### Backend
- **Node.js 18+** + Express.js
- **Sequelize ORM** (MySQL system DB)
- **Socket.IO** (real-time WebSocket)
- **JWT** (authentication)
- **bcryptjs** (password hashing)
- **crypto-js** (AES-256 credential encryption)
- **node-cron** (scheduled jobs)
- **Winston** (logging with daily rotation)
- **mysql2** + **pg** (database drivers)

---

## 📋 Prerequisites

- **Node.js** 18+
- **npm** 9+
- **MySQL 8+** (for the system database — stores users, jobs, logs)
- **MySQL 8+** or **PostgreSQL 14+** (target databases to migrate between)

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Project
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy and configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
PORT=5000
SYSTEM_DB_HOST=localhost
SYSTEM_DB_PORT=3306
SYSTEM_DB_NAME=dbmigrate_system
SYSTEM_DB_USER=root
SYSTEM_DB_PASSWORD=your_mysql_password

JWT_SECRET=your_super_secret_jwt_key_min_32_characters
ENCRYPTION_KEY=your_32_char_encryption_key_here!
CORS_ORIGIN=http://localhost:5173
```

### 3. Create the System Database

Run the schema SQL against your MySQL server:

```bash
mysql -u root -p < ../database/schema.sql
```

Or initialize via the built-in script (also syncs Sequelize models):

```bash
npm run db:init
```

This creates:
- All 8 tables
- Default Admin: `admin@demo.com` / `Admin@123`
- Default Engineer: `engineer@demo.com` / `Eng@123`

### 4. Start the Backend

```bash
npm run dev
```

Backend runs at `http://localhost:5000`

---

### 5. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 📁 Project Structure

```
Project/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express + Socket.IO entry point
│   │   ├── config/
│   │   │   ├── db.js                 # Sequelize system DB connection
│   │   │   └── encryption.js         # AES-256 encrypt/decrypt
│   │   ├── controllers/              # Route handlers
│   │   ├── middleware/               # Auth, RBAC, error handler
│   │   ├── models/                   # Sequelize ORM models
│   │   ├── routes/                   # Express routers
│   │   ├── scripts/
│   │   │   └── initDb.js             # DB seed script
│   │   ├── services/
│   │   │   ├── dbAdapter.js          # MySQL/PostgreSQL generic adapter
│   │   │   ├── migrationService.js   # Core migration engine
│   │   │   ├── monitoringService.js  # Real-time metrics polling
│   │   │   ├── validationService.js  # Data integrity checks
│   │   │   └── schedulerService.js   # node-cron scheduler
│   │   └── utils/
│   │       ├── logger.js             # Winston logger
│   │       └── reportGenerator.js    # CSV export
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Router + providers
│   │   ├── main.jsx                  # React entry point
│   │   ├── index.css                 # Global design system
│   │   ├── api/                      # Axios API modules
│   │   ├── components/
│   │   │   ├── Layout/               # Sidebar, Topbar, Layout
│   │   │   └── common/               # StatCard, Modal, ProgressBar, StatusBadge
│   │   ├── context/                  # AuthContext, ThemeContext
│   │   └── pages/
│   │       ├── Auth/                 # Login, Register
│   │       ├── Dashboard/            # Analytics overview
│   │       ├── Connections/          # DB connection manager
│   │       ├── Migration/            # Migration wizard
│   │       ├── Monitoring/           # Performance charts
│   │       ├── Validation/           # Data validation
│   │       ├── Logs/                 # Audit log viewer
│   │       └── Settings/             # User settings
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── database/
│   └── schema.sql                    # MySQL DDL
├── docs/
│   └── API.md                        # REST API reference
└── README.md
```

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.com` | `Admin@123` |
| Engineer | `engineer@demo.com` | `Eng@123` |

---

## 🌐 API Overview

See [docs/API.md](./docs/API.md) for complete documentation.

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/connections` | List connections |
| POST | `/api/connections` | Add connection |
| POST | `/api/connections/:id/test` | Test connectivity |
| GET | `/api/connections/:id/tables` | List tables |
| GET | `/api/migrations` | List migration jobs |
| POST | `/api/migrations` | Start migration |
| GET | `/api/monitoring/:connId/metrics` | Live DB metrics |
| GET | `/api/analytics/overview` | Dashboard KPIs |
| GET | `/api/logs` | Audit logs |
| GET | `/api/notifications` | Notifications |

---

## 🔌 Real-time Events (Socket.IO)

The backend emits real-time events for:
- **Migration progress** — per-batch updates with records count and percentage
- **Table completion** — when each table finishes migrating
- **Job status** — pending → running → completed/failed
- **Performance metrics** — live DB metrics every 10 seconds

---

## 🛡️ Security

- Passwords hashed with **bcrypt** (12 rounds)
- DB credentials encrypted with **AES-256** before storage
- **JWT** tokens (24h expiry)
- **Rate limiting** — 500 requests per 15 minutes per IP
- **Helmet.js** security headers
- Role-based access control (Admin > Engineer > Viewer)

---

## 🧪 Sample Dataset

To test migrations, add two database connections pointing to any MySQL or PostgreSQL databases. The migration engine will:
1. Count all rows in source tables
2. Read rows in configurable batches (default: 1000 rows/batch)
3. Write to destination with `ON DUPLICATE KEY UPDATE` / `ON CONFLICT DO NOTHING`
4. Emit real-time progress events

---

## 📝 Logs

Application logs are saved to `backend/logs/`:
- `app-YYYY-MM-DD.log` — All logs (rotated daily, 14 days retention)
- `error-YYYY-MM-DD.log` — Error logs only (30 days retention)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ for database engineers and cloud data teams**
