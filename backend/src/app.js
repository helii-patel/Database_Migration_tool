const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { startScheduler } = require('./services/schedulerService');
const { setIo: setMigrationIo } = require('./controllers/migrationController');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth');
const connectionRoutes = require('./routes/connections');
const migrationRoutes = require('./routes/migrations');
const monitoringRoutes = require('./routes/monitoring');
const analyticsRoutes = require('./routes/analytics');
const logsRoutes = require('./routes/logs');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  version: '1.0.0',
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/migrations', migrationRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

// Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_job', (jobId) => {
    socket.join(`job_${jobId}`);
    logger.info(`Socket ${socket.id} joined job_${jobId}`);
  });

  socket.on('leave_job', (jobId) => {
    socket.leave(`job_${jobId}`);
  });

  socket.on('monitor_connection', (connId) => {
    socket.join(`monitor_${connId}`);
    logger.info(`Socket ${socket.id} monitoring connection ${connId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Pass io to migration controller
setMigrationIo(io);

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  startScheduler(io);
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

module.exports = { app, io };
