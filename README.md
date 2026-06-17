<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  
  <br />
  
  <h1>🚀 Enterprise Database Migration & Query Translation Platform</h1>
</div>

<br />

---

## 📖 Project Description

**DBMigrate Pro** is an enterprise-grade full-stack platform engineered to seamlessly orchestrate database migrations across different systems, combined with real-time monitoring, data validation, and an AI-powered query translation layer. 

Designed for scalability and accuracy, the system allows database administrators and developers to safely migrate schema and records from MySQL to PostgreSQL (and vice versa) without downtime. The built-in **AI Query Translator** leverages state-of-the-art LLMs (via Groq/Llama models) to dynamically convert SQL queries into highly divergent NoSQL and graph syntax, including MongoDB MQL, Neo4j Cypher, and Elasticsearch Query DSL.

This platform bridges the gap between relational integrity and modern NoSQL flexibility, featuring role-based access, comprehensive audit logging, and detailed validation pipelines.

---

## ✨ Key Features

- **🌐 Database Connection Management**: Add, securely test, and manage SSL-supported connections to multiple databases (MySQL, PostgreSQL, Supabase).
- **🔄 Database Migration Engine**: End-to-end table discovery, schema translation, and asynchronous batch migration with live progress monitoring and retry mechanisms.
- **🤖 AI Query Translator**: LLM-powered engine translating MySQL into PostgreSQL, MongoDB, Neo4j, Oracle, MS SQL, Elasticsearch, and Firestore.
- **🛡️ Data Validation Module**: Automated comparison of source and destination records post-migration to guarantee 100% data integrity.
- **📊 Real-time Monitoring Dashboard**: Interactive visualizations of connection statuses, migration success metrics, and aggregate statistics.
- **📋 Audit Logging System**: Granular tracking of user activity, migration executions, and connection modifications with CSV export capability.

---

## 🏗️ Architecture Diagram

```ascii
                      +-------------------+
                      |   Frontend (React)|
                      | - Dashboards      |
                      | - Translators     |
                      | - Validation UI   |
                      +---------+---------+
                                |
                          [REST API]
                                |
                      +---------v---------+
                      | Backend (Node.js) |
                      | - Express Server  |
                      | - JWT Auth        |
                      +----+---------+----+
                           |         |
            +--------------+         +--------------+
            |                                       |
    +-------v-------+                       +-------v-------+
    | DB Migration  |                       | AI Translator |
    | Engine (Batch)|                       | (Groq API)    |
    +-------+-------+                       +-------+-------+
            |                                       |
    +-------v-------+                       +-------v-------+
    | Source DBs    |                       | LLM Models    |
    | (MySQL, PG)   |                       | (Llama 3)     |
    +-------+-------+                       +---------------+
            |
    +-------v-------+
    | Dest DBs      |
    | (PostgreSQL)  |
    +---------------+
```

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, ShadCN UI, Lucide Icons, React Router, Framer Motion |
| **Backend** | Node.js, Express.js, JavaScript/TypeScript, JWT, Socket.io |
| **Database Systems** | PostgreSQL, MySQL, Supabase (Cloud PostgreSQL) |
| **AI Layer** | Groq API SDK, Llama-3.3-70b-versatile, Prompt Engineering |

---

## ⚙️ System Workflows

### 🔄 Database Migration Flow
1. **Connection**: User registers and tests Source & Destination database credentials.
2. **Discovery**: System retrieves schemas, keys, constraints, and total record counts.
3. **Execution**: Tables are created automatically on the destination. Data is batched and streamed.
4. **Relationship Sync**: Foreign Keys and generated sequence constraints are deferred and synced in Phase 3.
5. **Validation**: Target row counts and schemas are automatically compared against the source.

### 🤖 AI Translation Flow
1. **Input**: User selects Source Language (e.g., MySQL) and Target Language (e.g., MongoDB MQL).
2. **Prompt Injection**: The query and dialects are injected into a highly specific system prompt.
3. **LLM Processing**: Groq's high-speed inference processes the translation via `llama-3.3-70b-versatile`.
4. **Sanitization**: The response is parsed, stripped of markdown artifacts, and displayed in the UI.

---

## 📂 Folder Structure

```text
DBMigrate Pro/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth & error handling
│   │   ├── models/           # DB schema models
│   │   ├── routes/           # Express API endpoints
│   │   ├── services/         # DB Adapter, AI Translator, Migration engine
│   │   └── utils/            # Logger, encryption utilities
│   ├── .env.example          # Environment vars example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              # API wrapper services
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context (Auth)
│   │   ├── pages/            # Application views (Dashboard, Migration, Translator)
│   │   └── App.jsx           # Main routing
│   ├── vite.config.js
│   └── package.json
```

---

## 🚀 Installation Guide

### Prerequisites
- **Node.js** (v18+)
- **MySQL / PostgreSQL** installed locally or hosted credentials.
- **Groq API Key** (for Query Translator).

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/dbmigrate-pro.git
cd dbmigrate-pro
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your local DB credentials and Groq API key
npm run dev
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```


---

<<<<<<< HEAD
=======
## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & receive JWT |
| `GET` | `/api/connections` | Retrieve all registered DB connections |
| `POST` | `/api/migrations/run` | Initiate asynchronous data migration |
| `GET` | `/api/monitoring/stats` | Fetch aggregate server and DB statistics |
| `POST` | `/api/query/translate` | Translate query string via Groq AI |
| `GET` | `/api/logs` | Fetch system audit logs |
>>>>>>> 7160fd6 (Upload project to GitHub)

---

## 📸 Application Screenshots

### 1. Dashboard Overview
![Dashboard](./Screenshots/Database_connection.png)

### 2. Database Connections
![Connections](./Screenshots/Add_database.png)

### 3. Migration Engine
![Migration](./Screenshots/Migration.png)

### 4. AI Query Translator
![Translator](./Screenshots/Translator.png)

### 5. Data Validation Dashboard
![Validation](./Screenshots/Validation.png)

*(Images are stored in the `/Screenshots` directory)*

---

## 🚀 Future Enhancements

- **Bi-Directional Schema Syncing**: Automatic polling to detect schema drift between linked databases.
- **Scheduling Engine**: Cron-based scheduled migrations for recurring ETL pipelines.
- **Additional Connectors**: Expand native support for MongoDB and Redis as migration targets.

---

## 🛡️ Security Features
- **AES-256 Encryption**: All database passwords and sensitive credentials are encrypted at rest.
- **JWT Authentication**: Role-based access control protecting API routes and actions.
- **Input Sanitization**: Protection against SQL Injection during connection validations.
- **Rate Limiting**: Integrated Express rate-limiting to prevent API abuse.

---

## ⚡ Performance Features
- **Asynchronous Batch Processing**: Migrations are chunked and streamed (default 1000 rows/batch) to prevent memory overflow on large datasets.
- **Socket.io Integration**: Real-time progress updates without heavy HTTP polling.
- **Deferred Constraints**: Foreign keys are applied post-migration to bypass dependency deadlock.

---

## 🎓 Learning Outcomes
- Developed comprehensive understanding of **ETL (Extract, Transform, Load)** pipelines and asynchronous data streaming.
- Mastered bridging modern **LLM APIs (Groq/Llama)** with traditional full-stack web applications.
- Implemented robust **security architectures**, focusing on encryption at rest and role-based access.


---

## 🏆 Project Highlights
- Fully automated **Phase 3 Foreign Key resolution** algorithm preventing complex relational deadlocks.
- High-performance API integration fetching translations via **Llama-3.3-70b-versatile**.
- Extensible, role-based, production-ready architecture designed for horizontal scalability.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
