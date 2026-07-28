/**
 * Pipeline / Kanban Security Tests  —  Task 1.4 / Phase 1G
 *
 * Covers every explicit test requirement from requirements.md §G8:
 *  • Unauthorized card move (other user's lead) → 404
 *  • Invalid stage transition (terminal → any, sales_rep → Won/Lost) → 403
 *  • Unauthenticated request → 401
 *  • Concurrency conflict (stale __v) → 409
 *  • Input sanitisation (XSS in content) → stored clean
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET          = 'test_secret';
process.env.JWT_REFRESH_SECRET  = 'test_refresh_secret';

const request = require('supertest');
const app     = require('../server');
const User    = require('../models/User');
const Lead    = require('../models/Lead');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

/* ── lifecycle ───────────────────────────────────────────── */
beforeAll(async () => { await connectTestDB(); });
afterEach(async () => { await clearTestDB();   });
afterAll(async ()  => { await closeTestDB();   });

/* ── helpers ─────────────────────────────────────────────── */
const makeUser = (overrides = {}) =>
  User.create({ name: 'Test', email: 'u@test.com', password: 'pass1234', role: 'sales_rep', ...overrides });

const loginUser = async (email, password = 'pass1234') => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data.token;
};

const makeLead = (owner, overrides = {}) =>
  Lead.create({
    name: 'Test Lead', email: 't@lead.com', status: 'New', source: 'website',
    owner: owner._id,
    activities: [{ type: 'created', content: 'created', createdBy: owner._id }],
    ...overrides,
  });

/* ═══════════════════════════════════════════════════════════
   G1 + G2 — Ownership / IDOR
   ═══════════════════════════════════════════════════════════ */
describe('G1+G2 — Ownership & IDOR protection', () => {
  it('returns 404 when user tries to move a lead they do not own', async () => {
    const owner   = await makeUser({ email: 'owner@test.com' });
    const attacker = await makeUser({ email: 'evil@test.com' });
    const lead    = await makeLead(owner);

    const token = await loginUser('evil@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Contacted' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('allows owner to move their own lead', async () => {
    const owner = await makeUser({ email: 'owner2@test.com' });
    const lead  = await makeLead(owner);
    const token = await loginUser('owner2@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Contacted' });

    expect(res.status).toBe(200);
    expect(res.body.data.lead.status).toBe('Contacted');
  });

  it('admin can move any lead regardless of owner', async () => {
    const owner = await makeUser({ email: 'repx@test.com' });
    const admin = await makeUser({ email: 'adm@test.com', role: 'admin' });
    const lead  = await makeLead(owner);
    const token = await loginUser('adm@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Qualified' });

    expect(res.status).toBe(200);
  });
});

/* ═══════════════════════════════════════════════════════════
   G3 — Stage transition enforcement
   ═══════════════════════════════════════════════════════════ */
describe('G3 — Stage transition validation', () => {
  it('rejects moving out of a terminal Won stage for non-admin', async () => {
    const rep  = await makeUser({ email: 'rep1@test.com' });
    const lead = await makeLead(rep, { status: 'Won' });
    const token = await loginUser('rep1@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Contacted' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin/i);
  });

  it('rejects moving out of a terminal Lost stage for manager', async () => {
    const mgr  = await makeUser({ email: 'mgr1@test.com', role: 'manager' });
    const lead = await makeLead(mgr, { status: 'Lost' });
    const token = await loginUser('mgr1@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'New' });

    expect(res.status).toBe(403);
  });

  it('admin can reopen a terminal-stage lead', async () => {
    const admin = await makeUser({ email: 'adm2@test.com', role: 'admin' });
    const lead  = await makeLead(admin, { status: 'Won' });
    const token = await loginUser('adm2@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Proposal' });

    expect(res.status).toBe(200);
  });

  it('rejects an invalid status value', async () => {
    const rep  = await makeUser({ email: 'rep2@test.com' });
    const lead = await makeLead(rep);
    const token = await loginUser('rep2@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'InvalidStage' });

    expect(res.status).toBe(422);
  });
});

/* ═══════════════════════════════════════════════════════════
   G4 — Role-based terminal-action restrictions
   ═══════════════════════════════════════════════════════════ */
describe('G4 — Role-based terminal actions', () => {
  it('sales_rep cannot close a deal as Won', async () => {
    const rep  = await makeUser({ email: 'repa@test.com' });
    const lead = await makeLead(rep, { status: 'Proposal' });
    const token = await loginUser('repa@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Won' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/manager|admin/i);
  });

  it('sales_rep cannot close a deal as Lost', async () => {
    const rep  = await makeUser({ email: 'repb@test.com' });
    const lead = await makeLead(rep, { status: 'Proposal' });
    const token = await loginUser('repb@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Lost' });

    expect(res.status).toBe(403);
  });

  it('manager CAN close a deal as Won', async () => {
    const mgr  = await makeUser({ email: 'mgr2@test.com', role: 'manager' });
    const lead = await makeLead(mgr, { status: 'Proposal' });
    const token = await loginUser('mgr2@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Won' });

    expect(res.status).toBe(200);
  });

  it('sales_rep cannot delete a lead', async () => {
    const rep  = await makeUser({ email: 'repd@test.com' });
    const lead = await makeLead(rep);
    const token = await loginUser('repd@test.com');

    const res = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('manager CAN delete a lead', async () => {
    const mgr  = await makeUser({ email: 'mgrd@test.com', role: 'manager' });
    const lead = await makeLead(mgr);
    const token = await loginUser('mgrd@test.com');

    const res = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

/* ═══════════════════════════════════════════════════════════
   G5 — Concurrency / optimistic locking
   ═══════════════════════════════════════════════════════════ */
describe('G5 — Optimistic concurrency control', () => {
  it('rejects a status update when client sends a stale __v', async () => {
    const rep  = await makeUser({ email: 'repc@test.com' });
    const lead = await makeLead(rep);
    const token = await loginUser('repc@test.com');

    // Simulate a stale version
    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Contacted', __v: 999 }); // wrong version

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/modified by another user/i);
    expect(res.body.data).toHaveProperty('currentVersion');
  });

  it('accepts a status update when __v is correct', async () => {
    const rep  = await makeUser({ email: 'repv@test.com' });
    const lead = await makeLead(rep);
    const token = await loginUser('repv@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Contacted', __v: lead.__v }); // correct version

    expect(res.status).toBe(200);
  });

  it('accepts a status update when __v is omitted (backward compat)', async () => {
    const rep  = await makeUser({ email: 'repw@test.com' });
    const lead = await makeLead(rep);
    const token = await loginUser('repw@test.com');

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Contacted' }); // no __v → no concurrency check

    expect(res.status).toBe(200);
  });
});

/* ═══════════════════════════════════════════════════════════
   G6 — Unauthenticated access
   ═══════════════════════════════════════════════════════════ */
describe('G6 — Unauthenticated requests', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app)
      .patch('/api/leads/000000000000000000000001/status')
      .send({ status: 'Won' });

    expect(res.status).toBe(401);
  });

  it('returns 401 with a garbage token', async () => {
    const res = await request(app)
      .patch('/api/leads/000000000000000000000001/status')
      .set('Authorization', 'Bearer totallybroken')
      .send({ status: 'Won' });

    expect(res.status).toBe(401);
  });
});

/* ═══════════════════════════════════════════════════════════
   G8 — Input sanitisation
   ═══════════════════════════════════════════════════════════ */
describe('G8 — Input sanitisation', () => {
  it('strips HTML from lead name on creation', async () => {
    const user  = await makeUser({ email: 'san1@test.com' });
    const token = await loginUser('san1@test.com');

    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name:   '<script>alert("xss")</script>Legit Name',
        email:  'san@example.com',
        source: 'website',
        force:  true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.lead.name).not.toContain('<script>');
    expect(res.body.data.lead.name).toContain('Legit Name');
  });

  it('strips javascript: protocol from notes', async () => {
    const user  = await makeUser({ email: 'san2@test.com' });
    const token = await loginUser('san2@test.com');

    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name:   'Safe Name',
        email:  'san2@example.com',
        notes:  'javascript:alert(1) click me',
        source: 'website',
        force:  true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.lead.notes).not.toContain('javascript:');
  });

  it('strips HTML from activity content', async () => {
    const rep   = await makeUser({ email: 'san3@test.com' });
    const lead  = await makeLead(rep);
    const token = await loginUser('san3@test.com');

    const res = await request(app)
      .post(`/api/leads/${lead._id}/activities`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type:    'note',
        content: '<img src=x onerror=alert(1)>Legit note',
      });

    expect(res.status).toBe(201);
    const activity = res.body.data.lead.activities[0];
    expect(activity.content).not.toContain('<img');
    expect(activity.content).toContain('Legit note');
  });
});

/* ═══════════════════════════════════════════════════════════
   Audit trail
   ═══════════════════════════════════════════════════════════ */
describe('Audit trail', () => {
  it('creates a status_change activity on every pipeline move', async () => {
    const rep   = await makeUser({ email: 'aud@test.com' });
    const lead  = await makeLead(rep);
    const token = await loginUser('aud@test.com');

    await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Contacted' });

    const updated = await Lead.findById(lead._id);
    const statusAct = updated.activities.find(a => a.type === 'status_change');

    expect(statusAct).toBeDefined();
    expect(statusAct.metadata.fromStatus).toBe('New');
    expect(statusAct.metadata.toStatus).toBe('Contacted');
  });
});
