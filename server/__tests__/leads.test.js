/**
 * Lead routes — CRUD, duplicate detection, status patch, analytics, CSV export
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const request = require('supertest');
const app = require('../server');
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

/* ── helpers ─────────────────────────────────────────────── */
let _userCounter = 0;

// Always use a unique email so tests don't collide even if clearTestDB is slow
const createAndLoginUser = async (overrides = {}) => {
  _userCounter += 1;
  const email = overrides.email || `user${_userCounter}@example.com`;
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Lead Tester',
      email,
      password: 'password123',
      ...overrides,
      email, // ensure the generated email wins
    });
  if (!regRes.body.data) {
    throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
  }
  return regRes.body.data.token;
};

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const leadPayload = (overrides = {}) => ({
  name: 'Jane Smith',
  email: 'jane@acme.com',
  phone: '5550001234',
  company: 'Acme Corp',
  status: 'New',
  source: 'website',
  tags: ['vip'],
  notes: 'Important lead',
  ...overrides,
});

/* ── POST /api/leads ─────────────────────────────────────── */
describe('POST /api/leads', () => {
  let token;
  beforeEach(async () => { token = await createAndLoginUser(); });

  it('creates a lead and returns 201', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload());

    expect(res.status).toBe(201);
    expect(res.body.data.lead).toMatchObject({
      name: 'Jane Smith',
      email: 'jane@acme.com',
      status: 'New',
      source: 'website',
    });
    expect(res.body.data.lead.tags).toContain('vip');
  });

  it('returns 422 for missing name', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload({ name: '' }));
    expect(res.status).toBe(422);
  });

  it('returns 422 for missing email', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload({ email: '' }));
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid status', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload({ status: 'BadStatus' }));
    expect(res.status).toBe(422);
  });

  it('returns 409 for duplicate email within same owner', async () => {
    await request(app).post('/api/leads').set(auth(token)).send(leadPayload());
    const res = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload()); // same email, same owner
    expect(res.status).toBe(409);
  });

  it('force-creates when force=true bypasses soft duplicate check', async () => {
    // First lead
    await request(app).post('/api/leads').set(auth(token)).send(leadPayload());
    // Second lead — different email so the DB unique index won't block it,
    // but same name+company triggers soft duplicate detection → force overrides it
    const res = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload({ email: 'jane2@acme.com', force: true }));
    expect(res.status).toBe(201);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/leads').send(leadPayload());
    expect(res.status).toBe(401);
  });
});

/* ── GET /api/leads ──────────────────────────────────────── */
describe('GET /api/leads', () => {
  let token;
  beforeEach(async () => {
    token = await createAndLoginUser();
    // Use force:true to bypass soft duplicate detection in test setup
    const r1 = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload({ email: 'lead1@example.com', name: 'Alice One', company: 'Alpha Ltd', force: true }));
    const r2 = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload({ name: 'Bob Jones', email: 'lead2@example.com', company: 'Beta LLC', status: 'Won', force: true }));
    if (r1.status !== 201) throw new Error(`Lead1 create failed: ${JSON.stringify(r1.body)}`);
    if (r2.status !== 201) throw new Error(`Lead2 create failed: ${JSON.stringify(r2.body)}`);
  });

  it('returns paginated lead list', async () => {
    const res = await request(app).get('/api/leads').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.leads).toHaveLength(2);
    expect(res.body.data.pagination).toMatchObject({ page: 1, total: 2 });
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get('/api/leads?status=Won')
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.leads).toHaveLength(1);
    expect(res.body.data.leads[0].status).toBe('Won');
  });

  it('respects pagination params', async () => {
    const res = await request(app)
      .get('/api/leads?page=1&limit=1')
      .set(auth(token));
    expect(res.body.data.leads).toHaveLength(1);
    expect(res.body.data.pagination.pages).toBe(2);
  });

  it('isolates leads per user — other user sees none', async () => {
    const otherToken = await createAndLoginUser();
    const res = await request(app).get('/api/leads').set(auth(otherToken));
    expect(res.body.data.leads).toHaveLength(0);
  });
});

/* ── GET /api/leads/:id ──────────────────────────────────── */
describe('GET /api/leads/:id', () => {
  let token, leadId;
  beforeEach(async () => {
    token = await createAndLoginUser();
    const res = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload());
    leadId = res.body.data.lead._id;
  });

  it('returns the lead by id', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadId}`)
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.lead._id).toBe(leadId);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .get('/api/leads/000000000000000000000000')
      .set(auth(token));
    expect(res.status).toBe(404);
  });
});

/* ── PUT /api/leads/:id ──────────────────────────────────── */
describe('PUT /api/leads/:id', () => {
  let token, leadId;
  beforeEach(async () => {
    token = await createAndLoginUser();
    const res = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload());
    leadId = res.body.data.lead._id;
  });

  it('updates the lead', async () => {
    const res = await request(app)
      .put(`/api/leads/${leadId}`)
      .set(auth(token))
      .send({ name: 'Updated Name', company: 'New Co' });
    expect(res.status).toBe(200);
    expect(res.body.data.lead.name).toBe('Updated Name');
    expect(res.body.data.lead.company).toBe('New Co');
  });

  it('logs a status_change activity when status changes', async () => {
    const res = await request(app)
      .put(`/api/leads/${leadId}`)
      .set(auth(token))
      .send({ status: 'Qualified' });
    const activities = res.body.data.lead.activities;
    expect(activities[0].type).toBe('status_change');
    expect(activities[0].content).toContain('Qualified');
  });
});

/* ── PATCH /api/leads/:id/status ─────────────────────────── */
describe('PATCH /api/leads/:id/status', () => {
  let token, leadId;
  beforeEach(async () => {
    token = await createAndLoginUser();
    const res = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload());
    leadId = res.body.data.lead._id;
  });

  it('patches status and returns updated lead', async () => {
    const res = await request(app)
      .patch(`/api/leads/${leadId}/status`)
      .set(auth(token))
      .send({ status: 'Won' });
    expect(res.status).toBe(200);
    expect(res.body.data.lead.status).toBe('Won');
  });

  it('returns 422 for invalid status', async () => {
    const res = await request(app)
      .patch(`/api/leads/${leadId}/status`)
      .set(auth(token))
      .send({ status: 'Invalid' });
    expect(res.status).toBe(422);
  });
});

/* ── POST /api/leads/:id/activities ─────────────────────── */
describe('POST /api/leads/:id/activities', () => {
  let token, leadId;
  beforeEach(async () => {
    token = await createAndLoginUser();
    const res = await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload());
    leadId = res.body.data.lead._id;
  });

  it('adds an activity to the lead', async () => {
    const res = await request(app)
      .post(`/api/leads/${leadId}/activities`)
      .set(auth(token))
      .send({ type: 'call', content: 'Had a great call' });
    expect(res.status).toBe(201);
    const activities = res.body.data.lead.activities;
    const callActivity = activities.find((a) => a.type === 'call');
    expect(callActivity).toBeDefined();
    expect(callActivity.content).toBe('Had a great call');
  });

  it('returns 422 for invalid activity type', async () => {
    const res = await request(app)
      .post(`/api/leads/${leadId}/activities`)
      .set(auth(token))
      .send({ type: 'invalid_type', content: 'test' });
    expect(res.status).toBe(422);
  });
});

/* ── GET /api/leads/analytics ────────────────────────────── */
describe('GET /api/leads/analytics', () => {
  let token;
  beforeEach(async () => {
    token = await createAndLoginUser();
    await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload({ email: 'new@analytics.com', status: 'New', phone: '1111111111' }));
    await request(app)
      .post('/api/leads')
      .set(auth(token))
      .send(leadPayload({ email: 'won@analytics.com', status: 'Won', phone: '2222222222', name: 'Won Lead', company: 'Won Corp' }));
  });

  it('returns counts, bySource, winRate, and trend', async () => {
    const res = await request(app).get('/api/leads/analytics').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('counts');
    expect(res.body.data).toHaveProperty('bySource');
    expect(res.body.data).toHaveProperty('winRate');
    expect(res.body.data).toHaveProperty('trend');
    expect(res.body.data.trend).toHaveLength(12);
    expect(res.body.data.counts.New).toBe(1);
    expect(res.body.data.counts.Won).toBe(1);
  });
});

/* ── DELETE /api/leads/:id ───────────────────────────────── */
describe('DELETE /api/leads/:id', () => {
  let adminToken, salesToken, leadId;

  beforeEach(async () => {
    // Create admin directly in DB then log in (pre-save hook hashes password)
    const User = require('../models/User');
    await User.create({
      name: 'Admin',
      email: 'admin@delete-test.com',
      password: 'password123',
      role: 'admin',
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@delete-test.com', password: 'password123' });
    if (!loginRes.body.data) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginRes.body)}`);
    }
    adminToken = loginRes.body.data.token;

    // Create a lead owned by admin
    const res = await request(app)
      .post('/api/leads')
      .set(auth(adminToken))
      .send(leadPayload({ email: 'deleteme@example.com' }));
    leadId = res.body.data.lead._id;

    // Register a sales_rep via normal route
    salesToken = await createAndLoginUser();
  });

  it('admin can delete a lead', async () => {
    const res = await request(app)
      .delete(`/api/leads/${leadId}`)
      .set(auth(adminToken));
    expect(res.status).toBe(200);
  });

  it('sales_rep cannot delete a lead — returns 403', async () => {
    const res = await request(app)
      .delete(`/api/leads/${leadId}`)
      .set(auth(salesToken));
    expect(res.status).toBe(403);
  });
});
