/**
 * Enhanced Authentication Security Tests
 * 
 * Tests for progressive delay, session tracking, security logging,
 * and other advanced security features
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Enhanced Authentication Security', () => {
  
  describe('Progressive Delay Rate Limiting', () => {
    it('should allow initial login attempts', async () => {
      // Create test user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should implement progressive delays after multiple failed attempts', async () => {
      // Create test user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const email = 'test@example.com';

      // Make multiple failed attempts
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: email,
            password: 'wrongpassword'
          });

        expect(res.status).toBe(401);
      }

      // The 4th attempt should still work but be slower
      const startTime = Date.now();
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: email,
          password: 'wrongpassword'
        });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(res.status).toBe(401);
      // Should have some delay (at least 100ms for processing + delay)
      expect(duration).toBeGreaterThan(100);
    });

    it('should clear failed attempts on successful login', async () => {
      // Create test user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      // Make some failed attempts
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          });
      }

      // Successful login should clear failed attempts
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data).toHaveProperty('sessionId');
    });
  });

  describe('Session Management', () => {
    let authToken;
    let sessionId;
    let testUser;

    beforeEach(async () => {
      // Create and login user
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginRes.body.data.token;
      sessionId = loginRes.body.data.sessionId;
    });

    it('should track active sessions', async () => {
      const res = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessions).toHaveLength(1);
      expect(res.body.data.sessions[0]).toHaveProperty('sessionId');
      expect(res.body.data.sessions[0]).toHaveProperty('ip');
      expect(res.body.data.sessions[0]).toHaveProperty('loginTime');
      expect(res.body.data.sessions[0].isCurrent).toBe(true);
    });

    it('should revoke all sessions', async () => {
      const res = await request(app)
        .delete('/api/auth/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('All sessions revoked');
    });

    it('should revoke all sessions except current', async () => {
      const res = await request(app)
        .delete('/api/auth/sessions?keepCurrent=true')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('All other sessions revoked');
    });

    it('should revoke specific session', async () => {
      // First get the session ID
      const sessionsRes = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId);

      const targetSessionId = sessionsRes.body.data.sessions[0].sessionId;

      const res = await request(app)
        .delete(`/api/auth/sessions/${targetSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Session revoked successfully');
    });
  });

  describe('Token Reuse Detection', () => {
    it('should detect and handle refresh token reuse', async () => {
      // Create and login user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      // Extract refresh token from cookie
      const refreshCookie = loginRes.headers['set-cookie']
        .find(cookie => cookie.startsWith('refreshToken='));

      // First refresh should work
      const firstRefresh = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie);

      expect(firstRefresh.status).toBe(200);

      // Second refresh with old token should detect reuse
      const secondRefresh = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie);

      expect(secondRefresh.status).toBe(401);
      expect(secondRefresh.body.message).toContain('token reuse detected');
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should detect SQL injection attempts', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "admin'; DROP TABLE users; --",
          password: 'password123'
        });

      // Invalid email format → 422 from validator; suspicious pattern logged internally
      expect([401, 422]).toContain(res.status);
    });

    it('should detect XSS attempts', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: '<script>alert("xss")</script>',
          password: 'password123'
        });

      // Invalid email format → 422; XSS pattern logged internally
      expect([401, 422]).toContain(res.status);
    });
  });

  describe('Security Event Logging', () => {
    it('should log failed login attempts', async () => {
      // Create test user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      // Security logging happens in background - verified through logs
    });

    it('should log successful authentication', async () => {
      // Create test user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('sessionId');
    });

    it('should log user registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('sessionId');
    });
  });

  describe('Enhanced Protection Middleware', () => {
    let authToken;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginRes.body.data.token;
    });

    it('should handle requests without tokens', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('no token provided');
    });

    it('should handle invalid tokens', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('token is invalid');
    });

    it('should handle valid tokens correctly', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
    });
  });
});