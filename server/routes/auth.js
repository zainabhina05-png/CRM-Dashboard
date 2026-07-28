const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const protect = require('../middleware/auth');
const {
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
} = require('../middleware/authSecurity');
const {
  validate,
  registerRules,
  loginRules,
} = require('../middleware/validators');

const router = express.Router();

// --- Token helpers ---

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (id) => {
  // Cryptographically random opaque token (not JWT — keeps payload out of client)
  const token = crypto.randomBytes(40).toString('hex');
  // Sign it so we can verify expiry without DB lookup on every request
  const signed = jwt.sign({ id, sub: token }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { raw: token, signed };
};

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// POST /api/auth/register
router.post('/register', progressiveDelayLimiter, detectSuspiciousActivity, registerRules, validate, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Log potential account enumeration attempt
      logSecurityEvent('REGISTRATION_ATTEMPT_EXISTING_EMAIL', {
        ip: req.ip,
        email: email,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        data: null,
      });
    }

    const user = await User.create({ name, email, password });

    // Log successful registration
    logSecurityEvent('USER_REGISTERED', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    const accessToken = generateAccessToken(user._id);
    const { raw: rawRefresh, signed: signedRefresh } = generateRefreshToken(user._id);

    // Track session for new user
    const sessionId = trackSession(user._id.toString(), {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Store hashed refresh token server-side for rotation/revocation
    const salt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(rawRefresh, salt);
    await user.save({ validateBeforeSave: false });

    // Send refresh token in httpOnly cookie
    res.cookie('refreshToken', signedRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: serializeUser(user),
        token: accessToken,
        sessionId: sessionId
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', progressiveDelayLimiter, detectSuspiciousActivity, loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password and refreshTokenHash since both are select:false
    const user = await User.findOne({ email }).select('+password +refreshTokenHash');

    if (!user) {
      trackFailedAttempt(req, email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      trackFailedAttempt(req, email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(req, email);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const { raw: rawRefresh, signed: signedRefresh } = generateRefreshToken(user._id);

    // Track session
    const sessionId = trackSession(user._id.toString(), {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Rotate refresh token on every login
    const salt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(rawRefresh, salt);
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', signedRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: serializeUser(user),
        token: accessToken,
        sessionId: sessionId // Include session ID for client tracking
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh — issue a new access token using the httpOnly refresh cookie
router.post('/refresh', async (req, res, next) => {
  try {
    const signedRefresh = req.cookies?.refreshToken;
    if (!signedRefresh) {
      logSecurityEvent('REFRESH_ATTEMPT_NO_TOKEN', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
        data: null,
      });
    }

    // Verify JWT signature + expiry on the signed refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        signedRefresh,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (jwtError) {
      logSecurityEvent('INVALID_REFRESH_TOKEN', {
        ip: req.ip,
        error: jwtError.message,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        success: false,
        message: 'Refresh token is invalid or expired',
        data: null,
      });
    }

    const user = await User.findById(decoded.id).select('+refreshTokenHash');
    if (!user) {
      logSecurityEvent('REFRESH_TOKEN_USER_NOT_FOUND', {
        ip: req.ip,
        userId: decoded.id,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    // Verify the raw token embedded in the signed JWT matches the stored hash
    const isValid = await user.compareRefreshToken(decoded.sub);
    if (!isValid) {
      // Possible token reuse — revoke all sessions and log critical security event
      revokeSessions(user._id.toString());
      user.refreshTokenHash = undefined;
      await user.save({ validateBeforeSave: false });

      logSecurityEvent('TOKEN_REUSE_DETECTED', {
        userId: user._id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        success: false,
        message: 'Refresh token reuse detected. Please log in again.',
        data: null,
      });
    }

    // Rotate: issue new access token + new refresh token
    const newAccessToken = generateAccessToken(user._id);
    const { raw: rawRefresh, signed: signedNew } = generateRefreshToken(user._id);

    // Update session activity
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      updateSessionActivity(user._id.toString(), sessionId);
    }

    const salt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(rawRefresh, salt);
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', signedNew, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logSecurityEvent('TOKEN_REFRESHED', {
      userId: user._id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: {
        token: newAccessToken,
        user: serializeUser(user),
        sessionId: sessionId
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout — clear refresh token cookie + revoke server-side
router.post('/logout', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshTokenHash');
    if (user) {
      user.refreshTokenHash = undefined;
      await user.save({ validateBeforeSave: false });
    }

    // Revoke current session
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      revokeSessions(req.user._id.toString(), null); // Revoke all sessions
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    logSecurityEvent('USER_LOGGED_OUT', {
      userId: req.user._id,
      sessionId: sessionId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile retrieved',
    data: { user: serializeUser(req.user) },
  });
});

// GET /api/auth/sessions — List active sessions for current user
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = getUserSessions(req.user._id.toString());
    const activeSessions = sessions.filter(s => s.isActive);

    res.status(200).json({
      success: true,
      message: 'Active sessions retrieved',
      data: {
        sessions: activeSessions.map(session => ({
          sessionId: session.sessionId,
          ip: session.ip,
          userAgent: session.userAgent,
          loginTime: session.loginTime,
          lastActivity: session.lastActivity,
          isCurrent: session.sessionId === req.headers['x-session-id']
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sessions',
      data: null
    });
  }
});

// DELETE /api/auth/sessions — Revoke all sessions (force re-authentication everywhere)
router.delete('/sessions', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshTokenHash');
    if (user) {
      user.refreshTokenHash = undefined;
      await user.save({ validateBeforeSave: false });
    }

    // Revoke all sessions except current one (optional)
    const keepCurrentSession = req.query.keepCurrent === 'true';
    const currentSessionId = keepCurrentSession ? req.headers['x-session-id'] : null;
    
    revokeSessions(req.user._id.toString(), currentSessionId);

    logSecurityEvent('ALL_SESSIONS_REVOKED', {
      userId: req.user._id,
      keptCurrentSession: keepCurrentSession,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: keepCurrentSession ? 
        'All other sessions revoked successfully' : 
        'All sessions revoked successfully',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to revoke sessions',
      data: null
    });
  }
});

// DELETE /api/auth/sessions/:sessionId — Revoke specific session
router.delete('/sessions/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userSessions = getUserSessions(req.user._id.toString());
    const session = userSessions.find(s => s.sessionId === sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
        data: null
      });
    }

    // Mark session as inactive
    session.isActive = false;

    logSecurityEvent('SESSION_REVOKED', {
      userId: req.user._id,
      revokedSessionId: sessionId,
      revokedSessionIp: session.ip,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to revoke session',
      data: null
    });
  }
});

module.exports = router;
