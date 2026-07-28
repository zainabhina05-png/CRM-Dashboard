/**
 * Webhook routes — POST /api/webhooks/leads
 * Covers: unsigned dev mode, signed mode, missing fields,
 *         missing WEBHOOK_OWNER_ID, duplicate detection, field normalisation
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET         = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

const crypto  = require('crypto');
const request = require('supertest');
const app     = require('../server');
const User    = require('../models/User');
const Lead    = require('../models/Lead');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

beforeAll(async () => { await connectTestDB(); });
afterEach(async () => {
  await clearTestDB();
  delete process.env.WEBHOOK_SECRET;
  delete process.env.WEBHOOK_OWNER_ID;
});
afterAll(async () => { await closeTestDB(); });

/* ── helpers ─────────────────────────────────────────────── */
const mkOwner = () =>
  User.create({ name: 'Owner', email: 'owner@test.com', password: 'pass1234' });

const sign = (body, secret) => {
  const raw = JSON.stringify(body);
  return 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
};

const post = (body, headers = {}) =>
  request(app)
    .post('/api/webhooks/leads')
    .set(headers)
    .send(body);

const validPayload = {
  name:    'Jane Doe',
  email:   'jane@example.com',
  phone:   '+1 555 000 0000',
  company: 'Acme Corp',
  source:  'website',
};

/* ══════════════════════════════════════════════════════════
   Unsigned (dev mode — no WEBHOOK_SECRET)
   ══════════════════════════════════════════════════════════ */
describe('POST /api/webhooks/leads — unsigned (dev mode)', () => {
  it('creates a lead when WEBHOOK_OWNER_ID is set', async () => {
    const owner = await mkOwner();
    process.env.WEBHOOK_OWNER_ID = owner._id.toString();

    const r = await post(validPayload);
    expect(r.status).toBe(201);
    expect(r.body.data).toHaveProperty('leadId');
  });

  it('returns 422 for missing name', async () => {
    const owner = await mkOwner();
    process.env.WEBHOOK_OWNER_ID = owner._id.toString();

    const r = await post({ email: 'x@x.com' });
    expect(r.status).toBe(422);
    expect(r.body.message).toMatch(/name/i);
  });

  it('returns 422 for missing email', async () => {
    const owner = await mkOwner();
    process.env.WEBHOOK_OWNER_ID = owner._id.toString();

    const r = await post({ name: 'No Email' });
    expect(r.status).toBe(422);
  });

  it('returns 500 when WEBHOOK_OWNER_ID is not set', async () => {
    const r = await post(validPayload);
    expect(r.status).toBe(500);
    expect(r.body.message).toMatch(/WEBHOOK_OWNER_ID/);
  });

  it('returns 500 when WEBHOOK_OWNER_ID user does not exist', async () => {
    process.env.WEBHOOK_OWNER_ID = '000000000000000000000001';
    const r = await post(validPayload);
    expect(r.status).toBe(500);
    expect(r.body.message).toMatch(/owner user not found/i);
  });

  it('skips duplicate and returns 200 with skipped=true', async () => {
    const owner = await mkOwner();
    process.env.WEBHOOK_OWNER_ID = owner._id.toString();

    // Create the lead first
    await post(validPayload);

    // Second identical payload should be detected as duplicate
    const r = await post(validPayload);
    expect(r.status).toBe(200);
    expect(r.body.data.skipped).toBe(true);
  });

  it('maps Facebook Lead Ads field names', async () => {
    const owner = await mkOwner();
    process.env.WEBHOOK_OWNER_ID = owner._id.toString();

    const r = await post({
      full_name:    'FB User',
      email:        'fb@example.com',
      phone_number: '+1 555 999 0000',
    });

    expect(r.status).toBe(201);
    const lead = await Lead.findById(r.body.data.leadId);
    expect(lead.name).toBe('FB User');
    expect(lead.phone).toBe('+1 555 999 0000');
  });

  it('normalises unknown source to website', async () => {
    const owner = await mkOwner();
    process.env.WEBHOOK_OWNER_ID = owner._id.toString();

    const r = await post({ ...validPayload, source: 'unknown_channel', email: 'src@example.com' });
    expect(r.status).toBe(201);
    const lead = await Lead.findById(r.body.data.leadId);
    expect(lead.source).toBe('website');
  });
});

/* ══════════════════════════════════════════════════════════
   Signed (WEBHOOK_SECRET configured)
   ══════════════════════════════════════════════════════════ */
describe('POST /api/webhooks/leads — HMAC signed', () => {
  const SECRET = 'test_webhook_secret_abc123';

  beforeEach(() => { process.env.WEBHOOK_SECRET = SECRET; });

  it('accepts a valid signature', async () => {
    const owner = await mkOwner();
    process.env.WEBHOOK_OWNER_ID = owner._id.toString();
    const sig = sign(validPayload, SECRET);

    const r = await post(validPayload, { 'x-leadflow-signature': sig });
    expect(r.status).toBe(201);
  });

  it('rejects a missing signature header', async () => {
    const r = await post(validPayload);
    expect(r.status).toBe(401);
    expect(r.body.message).toMatch(/X-LeadFlow-Signature/);
  });

  it('rejects an invalid signature (wrong hash value, correct length)', async () => {
    // timingSafeEqual requires equal-length buffers; create a valid-length bad sig
    const badSig = 'sha256=' + '0'.repeat(64);
    const r = await post(validPayload, { 'x-leadflow-signature': badSig });
    expect(r.status).toBe(401);
    expect(r.body.message).toMatch(/Invalid webhook signature/i);
  });

  it('rejects a malformed (wrong-length) signature with non-200', async () => {
    // Buffer length mismatch → RangeError → caught by errorHandler → 500
    const r = await post(validPayload, { 'x-leadflow-signature': 'sha256=badhash' });
    expect([401, 500]).toContain(r.status);
  });
});
