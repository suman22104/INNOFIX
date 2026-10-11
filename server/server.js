const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Fail-fast security check
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is missing in .env!');
  process.exit(1);
}

const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const { setupSocketIO } = require('./socket/socketHandler');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Setup Socket.IO real-time event system
const socketService = setupSocketIO(io);
app.set('socketService', socketService);

// DB Readiness Middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1 && !req.path.startsWith('/api/health')) {
    return res.status(503).json({
      success: false,
      message: 'Service is temporarily unavailable while connecting to the database. Please try again in a few seconds.',
      retryAfter: 5
    });
  }
  next();
});

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline styles and external avatars
    crossOriginEmbedderPolicy: false,
  })
);

// Prevent NoSQL Injection attacks
app.use(mongoSanitize());

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 login/register attempts per 15 min
  skipSuccessfulRequests: true, // Only rate limit failures
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// Body Parsers (with size limits to prevent abuse)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);

// Dev logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static folder for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/opportunities', require('./routes/opportunityRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Interactive Swagger / OpenAPI Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'INNOFIX AI: AI-Powered Social Networking API',
    version: '2.0.0',
    description:
      'Production-grade RESTful and Real-Time WebSocket API for INNOFIX AI Social Network.',
  },
  servers: [{ url: '/api', description: 'Local Development Server' }],
  paths: {
    '/health': {
      get: {
        summary: 'API Health Check',
        responses: { 200: { description: 'API status online and operational' } },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register new user account',
        responses: { 201: { description: 'User registered with JWT' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and obtain JWT',
        responses: { 200: { description: 'Token and profile returned' } },
      },
    },
    '/posts': {
      get: { summary: 'Get smart ranked feed or tabbed posts' },
      post: { summary: 'Create new post with AI moderation check' },
    },
    '/messages': {
      post: { summary: 'Send direct real-time message' },
    },
    '/ai/people-you-may-know': {
      get: { summary: 'Get explainable People You May Know graph recommendations' },
    },
    '/ai/assistant/improve-bio': {
      post: { summary: 'AI profile coach enhancement' },
    },
    '/search': {
      get: { summary: 'Global omni-search across people, posts, projects, communities, events' },
    },
  },
};
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'INNOFIX AI: AI-Powered Social Network',
    version: '2.0.0',
    socketConnections: socketService.getOnlineUserIds().length,
    timestamp: new Date(),
  });
});

// Production Static File Serving (robust path resolution)
const clientDistCandidates = [
  path.join(__dirname, '../client/dist'),
  path.join(__dirname, '../../client/dist'),
  path.join(__dirname, 'client/dist'),
];

let clientDistPath = clientDistCandidates.find((p) => fs.existsSync(p)) || path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head><title>INNOFIX AI Server</title></head>
      <body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
        <h1 style="color: #fbbf24;">💡 INNOFIX AI Backend API</h1>
        <p>AI-Powered Social Network Server is running smoothly.</p>
        <p><a href="/api/docs" style="color: #38bdf8;">Explore Swagger API Docs (/api/docs)</a></p>
        <p><a href="/api/health" style="color: #34d399;">System Health Check (/api/health)</a></p>
      </body>
      </html>
    `);
  }
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await connectDB();
      
      // Admin Bootstrap Logic
      const User = require('./models/User');
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 0 && process.env.ADMIN_BOOTSTRAP_EMAIL) {
        console.log(`[BOOTSTRAP] 0 admins found. Bootstrapping admin account for ${process.env.ADMIN_BOOTSTRAP_EMAIL}...`);
        const bcrypt = require('bcryptjs');
        const defaultPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Admin123!';
        
        await User.create({
          fullName: 'System Administrator',
          username: 'admin',
          email: process.env.ADMIN_BOOTSTRAP_EMAIL,
          password: defaultPassword, // Model hook will hash this
          role: 'admin',
          mustChangePassword: true
        });
        console.log(`[BOOTSTRAP] ✅ Admin account created successfully!`);
      }

      server.listen(PORT, () => {
        console.log(`🚀 INNOFIX AI Server running on http://localhost:${PORT}`);
        console.log(`📖 API Documentation available at http://localhost:${PORT}/api/docs`);
      });
    } catch (err) {
      console.error('❌ FATAL: Server failed to start due to database error:', err);
      process.exit(1);
    }
  }
};

startServer();

// Graceful Shutdown
const shutdown = () => {
  console.log('\n[SERVER] Gracefully shutting down...');
  server.close(() => {
    console.log('[SERVER] HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('[DB] MongoDB connection closed.');
      process.exit(0);
    });
  });
  
  // Force exit if taking too long
  setTimeout(() => {
    console.error('[SERVER] Forcefully shutting down after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { app, server };

