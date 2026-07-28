/**
 * Error handler middleware — tests every branch:
 *   ValidationError, duplicate key (11000), CastError,
 *   JsonWebTokenError, TokenExpiredError, generic statusCode, default 500
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET         = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

const request = require('supertest');
const express = require('express');
const errorHandler = require('../middleware/errorHandler');

// Build a minimal Express app that throws various error types
const mkApp = () => {
  const a = express();
  a.use(express.json());

  a.get('/validation-error', (req, res, next) => {
    const err = new Error('Bad input');
    err.name = 'ValidationError';
    err.errors = {
      email: { message: 'Email is invalid' },
      name:  { message: 'Name is required' },
    };
    next(err);
  });

  a.get('/duplicate-key', (req, res, next) => {
    const err = new Error('Duplicate key');
    err.code = 11000;
    err.keyValue = { email: 'x@x.com' };
    next(err);
  });

  a.get('/cast-error', (req, res, next) => {
    const err = new Error('Cast failed');
    err.name  = 'CastError';
    err.path  = '_id';
    err.value = 'notanid';
    next(err);
  });

  a.get('/jwt-error', (req, res, next) => {
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    next(err);
  });

  a.get('/jwt-expired', (req, res, next) => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    next(err);
  });

  a.get('/custom-status', (req, res, next) => {
    const err = new Error('Custom error');
    err.statusCode = 418;
    next(err);
  });

  a.get('/generic-500', (req, res, next) => {
    next(new Error('boom'));
  });

  a.use(errorHandler);
  return a;
};

const app = mkApp();

describe('errorHandler middleware', () => {
  it('handles ValidationError with 400 and joined messages', async () => {
    const r = await request(app).get('/validation-error');
    expect(r.status).toBe(400);
    expect(r.body.success).toBe(false);
    expect(r.body.message).toContain('Email is invalid');
    expect(r.body.message).toContain('Name is required');
  });

  it('handles duplicate key error with 409', async () => {
    const r = await request(app).get('/duplicate-key');
    expect(r.status).toBe(409);
    expect(r.body.message).toMatch(/Duplicate value for: email/);
  });

  it('handles CastError with 400', async () => {
    const r = await request(app).get('/cast-error');
    expect(r.status).toBe(400);
    expect(r.body.message).toMatch(/Invalid _id: notanid/);
  });

  it('handles JsonWebTokenError with 401', async () => {
    const r = await request(app).get('/jwt-error');
    expect(r.status).toBe(401);
    expect(r.body.message).toBe('Invalid token');
  });

  it('handles TokenExpiredError with 401', async () => {
    const r = await request(app).get('/jwt-expired');
    expect(r.status).toBe(401);
    expect(r.body.message).toBe('Token has expired');
  });

  it('uses custom statusCode when set on error', async () => {
    const r = await request(app).get('/custom-status');
    expect(r.status).toBe(418);
    expect(r.body.message).toBe('Custom error');
  });

  it('defaults to 500 for generic errors', async () => {
    const r = await request(app).get('/generic-500');
    expect(r.status).toBe(500);
    expect(r.body.message).toBe('boom');
  });
});
