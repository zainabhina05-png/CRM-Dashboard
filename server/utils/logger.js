/**
 * Centralised Winston logger.
 *
 * Log levels (lowest → highest severity):
 *   error | warn | info | http | debug
 *
 * In production: info+ written to combined.log, errors to error.log.
 * In development: colourised console output.
 * In test: silent (no output during Jest runs).
 */
const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, splat } = format;

const env = process.env.NODE_ENV || 'development';

/* ── Human-readable format for development ─────────────── */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp: ts, stack }) => {
    return stack
      ? `${ts} [${level}] ${message}\n${stack}`
      : `${ts} [${level}] ${message}`;
  })
);

/* ── JSON format for production (machine-parseable) ─────── */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  format.json()
);

/* ── Log file paths ─────────────────────────────────────── */
const LOG_DIR = path.join(__dirname, '..', 'logs');

const logger = createLogger({
  level: env === 'production' ? 'info' : 'debug',
  silent: env === 'test',
  format: env === 'production' ? prodFormat : devFormat,
  transports: [
    // Always write to console
    new transports.Console(),
  ],
});

// In production, also write to rotating log files
if (env === 'production') {
  logger.add(
    new transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    })
  );
  logger.add(
    new transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 10,
    })
  );
}

module.exports = logger;
