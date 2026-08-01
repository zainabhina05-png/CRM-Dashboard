const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const reminderScheduler = require('./utils/reminderScheduler');
const logger = require('./utils/logger');

// Load env vars
dotenv.config();

const app = express();

// Connect to database (async - don't block on startup in serverless)
if (process.env.VERCEL) {
  // Lazy connection for serverless - connect on first request
  app.use(async (req, res, next) => {
    if (!req.dbConnected) {
      try {
        await connectDB();
        req.dbConnected = true;
      } catch (error) {
        logger.error('DB connection middleware failed:', error);
      }
    }
    next();
  });
} else if (process.env.NODE_ENV !== 'test') {
  // Traditional server — connect immediately (skip in test; setup.js owns the connection)
  connectDB();
}

// Start the reminder scheduler after a brief delay to ensure DB is ready (SKIP on Vercel)
if (!process.env.VERCEL) {
  setTimeout(() => {
    reminderScheduler.start();
  }, 2000);
}

// --- Security & utility middleware ---
app.use(helmet());

// HTTP request logging via Morgan → piped into Winston
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
    // Skip health-check noise in production
    skip: (req) =>
      process.env.NODE_ENV === 'production' && req.url === '/api/health',
  })
);

// CORS — allow all Vercel apps during development, restrict in production via CLIENT_ORIGIN
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      // Always allow localhost
      if (origin.includes('localhost')) {
        return callback(null, true);
      }
      
      // Always allow .vercel.app and .netlify.app origins
      if (origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) {
        return callback(null, true);
      }
      
      // Check CLIENT_ORIGIN if set
      if (process.env.CLIENT_ORIGIN && origin === process.env.CLIENT_ORIGIN) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(compression());
app.use(cookieParser());

// Rate limiting — general API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later', data: null },
});
app.use('/api', limiter);

// Stricter rate limit on auth endpoints
// Note: Enhanced progressive delay limiting is now handled in routes/auth.js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 30, // Increased to account for progressive delays
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later', data: null },
});
// Apply basic rate limiting - enhanced security is in auth routes
app.use('/api/auth/register', authLimiter);
// Login and refresh use progressive delay limiter in routes

// Stricter rate limit on webhook endpoint
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Webhook rate limit exceeded', data: null },
});
app.use('/api/webhooks', webhookLimiter);

// Body parsers — capture raw body for webhook HMAC verification
app.use(express.json({
  limit: '10kb',
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));
app.use(express.urlencoded({ extended: false }));

// --- Routes (with enhanced security middleware) ---
app.use('/api/auth',      require('./routes/auth')); // Enhanced with progressive delays, session tracking, security logging
app.use('/api/leads',     require('./routes/leads'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/webhooks',  require('./routes/webhooks'));

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is running', data: null });
});

// Debug endpoint — shows env var presence (no values exposed)
app.get('/api/debug', (_req, res) => {
  res.json({
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    clientOrigin: process.env.CLIENT_ORIGIN,
    nodeEnv: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
  });
});

// Global error handler (registered last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

module.exports = app; // export for Supertest
