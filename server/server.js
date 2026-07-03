const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// --- Security & utility middleware ---

// Set security HTTP headers
app.use(helmet());

// Enable CORS with multiple origin support (Vercel/Netlify preview URLs)
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_ORIGIN, // Production URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      // Allow localhost, vercel.app, netlify.app, and configured CLIENT_ORIGIN
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.netlify.app')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Compress responses
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    data: null,
  },
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// --- Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    data: null,
  });
});

// --- Global error handler (registered last) ---
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
