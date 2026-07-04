const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const protect = require('../middleware/auth');
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
router.post('/register', registerRules, validate, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        data: null,
      });
    }

    const user = await User.create({ name, email, password });

    const accessToken = generateAccessToken(user._id);
    const { raw: rawRefresh, signed: signedRefresh } = generateRefreshToken(user._id);

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
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password and refreshTokenHash since both are select:false
    const user = await User.findOne({ email }).select('+password +refreshTokenHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    const accessToken = generateAccessToken(user._id);
    const { raw: rawRefresh, signed: signedRefresh } = generateRefreshToken(user._id);

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
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is invalid or expired',
        data: null,
      });
    }

    const user = await User.findById(decoded.id).select('+refreshTokenHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    // Verify the raw token embedded in the signed JWT matches the stored hash
    const isValid = await user.compareRefreshToken(decoded.sub);
    if (!isValid) {
      // Possible token reuse — revoke all sessions
      user.refreshTokenHash = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({
        success: false,
        message: 'Refresh token reuse detected. Please log in again.',
        data: null,
      });
    }

    // Rotate: issue new access token + new refresh token
    const newAccessToken = generateAccessToken(user._id);
    const { raw: rawRefresh, signed: signedNew } = generateRefreshToken(user._id);

    const salt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(rawRefresh, salt);
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', signedNew, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: {
        token: newAccessToken,
        user: serializeUser(user),
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

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
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

module.exports = router;
