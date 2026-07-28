/**
 * Enhanced Authentication Security Middleware
 * 
 * Provides advanced security features including:
 * - Progressive delay on failed attempts
 * - Session tracking and management
 * - Security event logging
 * - Suspicious activity detection
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// In-memory store for tracking failed attempts (in production, use Redis)
const failedAttempts = new Map();
const activeSessions = new Map();

/**
 * Progressive delay middleware for failed login attempts.
 * Uses a fixed window (20 reqs / 15 min, test-mode unbounded) as the outer
 * guard, and an in-process counter to add increasing delays.
 */
const progressiveDelayLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: async (req, res) => {
    const key = `${req.ip}:${req.body?.email || 'unknown'}`;
    const attempts = failedAttempts.get(key) || 0;

    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      email: req.body?.email,
      attempts,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    // Progressive delay: 1 s → 5 s → 15 s → 30 s
    let delayMs = 0;
    if (attempts > 6) delayMs = 30000;
    else if (attempts > 4) delayMs = 15000;
    else if (attempts > 2) delayMs = 5000;
    else if (attempts > 0) delayMs = 1000;

    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));

    res.status(429).json({
      success: false,
      message: 'Too many failed login attempts. Please wait before trying again.',
      data: {
        attemptsRemaining: Math.max(0, 5 - attempts),
        nextAttemptAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    });
  }
});

/**
 * Track failed authentication attempts
 */
const trackFailedAttempt = (req, email = null) => {
  const key = `${req.ip}:${email || req.body?.email || 'unknown'}`;
  const currentAttempts = failedAttempts.get(key) || 0;
  const newAttempts = currentAttempts + 1;
  
  failedAttempts.set(key, newAttempts);
  
  // Auto-expire failed attempts after 1 hour
  setTimeout(() => {
    const current = failedAttempts.get(key) || 0;
    if (current === newAttempts) {
      failedAttempts.delete(key);
    }
  }, 60 * 60 * 1000);

  // Log security event
  logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
    ip: req.ip,
    email: email || req.body?.email,
    attempts: newAttempts,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  return newAttempts;
};

/**
 * Clear failed attempts on successful authentication
 */
const clearFailedAttempts = (req, email = null) => {
  const key = `${req.ip}:${email || req.body?.email || 'unknown'}`;
  failedAttempts.delete(key);
  
  // Log successful authentication
  logSecurityEvent('SUCCESSFUL_LOGIN', {
    ip: req.ip,
    email: email || req.body?.email,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
};

/**
 * Session tracking and management
 */
const trackSession = (userId, sessionInfo) => {
  const userSessions = activeSessions.get(userId) || [];
  const sessionId = generateSessionId();
  
  const session = {
    sessionId,
    ip: sessionInfo.ip,
    userAgent: sessionInfo.userAgent,
    loginTime: new Date(),
    lastActivity: new Date(),
    isActive: true
  };
  
  // Keep only last 5 sessions per user
  userSessions.push(session);
  if (userSessions.length > 5) {
    userSessions.shift();
  }
  
  activeSessions.set(userId, userSessions);
  
  logSecurityEvent('SESSION_CREATED', {
    userId,
    sessionId,
    ip: sessionInfo.ip,
    userAgent: sessionInfo.userAgent,
    timestamp: new Date().toISOString()
  });
  
  return sessionId;
};

/**
 * Update session activity
 */
const updateSessionActivity = (userId, sessionId) => {
  const userSessions = activeSessions.get(userId) || [];
  const session = userSessions.find(s => s.sessionId === sessionId);
  
  if (session) {
    session.lastActivity = new Date();
    activeSessions.set(userId, userSessions);
  }
};

/**
 * Revoke user sessions
 */
const revokeSessions = (userId, keepSessionId = null) => {
  const userSessions = activeSessions.get(userId) || [];
  
  userSessions.forEach(session => {
    if (session.sessionId !== keepSessionId) {
      session.isActive = false;
    }
  });
  
  if (!keepSessionId) {
    activeSessions.delete(userId);
  } else {
    activeSessions.set(userId, userSessions.filter(s => s.sessionId === keepSessionId));
  }
  
  logSecurityEvent('SESSIONS_REVOKED', {
    userId,
    keptSessionId: keepSessionId,
    timestamp: new Date().toISOString()
  });
};

/**
 * Get user sessions
 */
const getUserSessions = (userId) => {
  return activeSessions.get(userId) || [];
};

/**
 * Security event logging with structured format
 */
const logSecurityEvent = (eventType, details) => {
  const logEntry = {
    type: 'SECURITY_EVENT',
    event: eventType,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  // Use appropriate log level based on event type
  const criticalEvents = ['RATE_LIMIT_EXCEEDED', 'FAILED_LOGIN_ATTEMPT', 'TOKEN_REUSE_DETECTED'];
  if (criticalEvents.includes(eventType)) {
    logger.warn('Security Event', logEntry);
  } else {
    logger.info('Security Event', logEntry);
  }
  
  // In production, also send to security monitoring system
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integration with security monitoring service (e.g., Sentry, DataDog)
    // securityMonitor.track(logEntry);
  }
};

/**
 * Generate unique session ID
 */
const generateSessionId = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Middleware to detect suspicious activity patterns
 */
const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    // Check for SQL injection attempts in email
    /['";]|union|select|drop|exec|script/i,
    // Check for XSS attempts
    /<script|javascript:|on\w+\s*=/i,
    // Check for common attack patterns
    /\.\.|\/\.\.|\\\.\.|\.\.\\/i
  ];
  
  const email = req.body?.email || '';
  const password = req.body?.password || '';
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(email) || pattern.test(password)
  );
  
  if (isSuspicious) {
    logSecurityEvent('SUSPICIOUS_REQUEST_DETECTED', {
      ip: req.ip,
      email: email,
      userAgent: req.get('user-agent'),
      requestBody: JSON.stringify(req.body).substring(0, 200), // Truncate for logs
      timestamp: new Date().toISOString()
    });
    
    // Still allow request to continue (don't reveal detection)
    // but track for monitoring
  }
  
  next();
};

/**
 * Enhanced protect middleware with session tracking
 */
const enhancedProtect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
        data: null,
      });
    }

    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logSecurityEvent('INVALID_TOKEN_USED', {
        ip: req.ip,
        userId: decoded.id,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
        data: null,
      });
    }

    // Update session activity if session tracking is available
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      updateSessionActivity(user._id, sessionId);
    }

    req.user = user;
    req.securityContext = {
      sessionId,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    next();
  } catch (error) {
    logSecurityEvent('TOKEN_VERIFICATION_FAILED', {
      ip: req.ip,
      error: error.message,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token is invalid',
      data: null,
    });
  }
};

module.exports = {
  progressiveDelayLimiter,
  trackFailedAttempt,
  clearFailedAttempts,
  trackSession,
  updateSessionActivity,
  revokeSessions,
  getUserSessions,
  logSecurityEvent,
  detectSuspiciousActivity,
  enhancedProtect
};