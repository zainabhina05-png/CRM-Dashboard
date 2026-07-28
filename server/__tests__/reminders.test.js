/**
 * Reminder routes — GET, POST, PATCH /complete, DELETE
 * Covers all 5 endpoints + negative cases + validation
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET         = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

const request = require('supertest');
const app     = require('../server');
const User    = require('../models/User');
const Lead    = require('../models/Lead');
const Reminder= require('../models/Reminder');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

beforeAll(async () => { await connectTestDB(); });
afterEach(async () => { await clearTestDB();   });
afterAll(async ()  => { await closeTestDB();   });

/* ── helpers ─────────────────────────────────────────────── */
const mkUser = (n = 1) =>
  User.create({ name: 'U', email: `u${n}@test.com`, password: 'pass1234' });

const login = async (email) => {
  const r = await request(app).post('/api/auth/login').send({ email, password: 'pass1234' });
  return r.body.data.token;
};

const mkLead = (owner) =>
  Lead.create({
    name: 'L', email: 'l@lead.com', status: 'New', source: 'website',
    owner: owner._id,
    activities: [{ type: 'created', content: 'c', createdBy: owner._id }],
  });

const auth = (t) => ({ Authorization: `Bearer ${t}` });

const future = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

/* ══════════════════════════════════════════════════════════
   GET /api/reminders
   ══════════════════════════════════════════════════════════ */
describe('GET /api/reminders', () => {
  it('returns empty array when no reminders', async () => {
    const u = await mkUser(1); const t = await login(u.email);
    const r = await request(app).get('/api/reminders').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.data.reminders).toEqual([]);
  });

  it('returns only pending reminders by default', async () => {
    const u = await mkUser(2); const t = await login(u.email);
    const lead = await mkLead(u);
    await Reminder.create({ title: 'A', dueDate: future(), lead: lead._id, owner: u._id, completed: false });
    await Reminder.create({ title: 'B', dueDate: future(), lead: lead._id, owner: u._id, completed: true  });

    const r = await request(app).get('/api/reminders').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.data.reminders).toHaveLength(1);
    expect(r.body.data.reminders[0].title).toBe('A');
  });

  it('returns completed reminders when completed=true', async () => {
    const u = await mkUser(3); const t = await login(u.email);
    const lead = await mkLead(u);
    await Reminder.create({ title: 'Done', dueDate: future(), lead: lead._id, owner: u._id, completed: true });

    const r = await request(app).get('/api/reminders?completed=true').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.data.reminders[0].title).toBe('Done');
  });

  it('filters by leadId', async () => {
    const u = await mkUser(4); const t = await login(u.email);
    const lead1 = await mkLead(u);
    const lead2 = await Lead.create({ name: 'L2', email: 'l2@lead.com', status: 'New', source: 'website', owner: u._id, activities: [{ type:'created', content:'c', createdBy: u._id }] });
    await Reminder.create({ title: 'R1', dueDate: future(), lead: lead1._id, owner: u._id });
    await Reminder.create({ title: 'R2', dueDate: future(), lead: lead2._id, owner: u._id });

    const r = await request(app).get(`/api/reminders?leadId=${lead1._id}`).set(auth(t));
    expect(r.body.data.reminders).toHaveLength(1);
    expect(r.body.data.reminders[0].title).toBe('R1');
  });

  it('returns 401 without token', async () => {
    const r = await request(app).get('/api/reminders');
    expect(r.status).toBe(401);
  });
});

/* ══════════════════════════════════════════════════════════
   GET /api/reminders/summary
   ══════════════════════════════════════════════════════════ */
describe('GET /api/reminders/summary', () => {
  it('returns summary counts', async () => {
    const u = await mkUser(5); const t = await login(u.email);
    const lead = await mkLead(u);
    // overdue
    await Reminder.create({ title: 'O', dueDate: new Date(Date.now() - 86400000), lead: lead._id, owner: u._id, completed: false });
    // due today (right now)
    await Reminder.create({ title: 'T', dueDate: new Date(Date.now() + 3600000),  lead: lead._id, owner: u._id, completed: false });

    const r = await request(app).get('/api/reminders/summary').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveProperty('overdue');
    expect(r.body.data).toHaveProperty('dueToday');
    expect(r.body.data).toHaveProperty('dueThisWeek');
    expect(r.body.data.overdue).toBeGreaterThanOrEqual(1);
  });
});

/* ══════════════════════════════════════════════════════════
   POST /api/reminders
   ══════════════════════════════════════════════════════════ */
describe('POST /api/reminders', () => {
  it('creates a reminder successfully', async () => {
    const u = await mkUser(6); const t = await login(u.email);
    const lead = await mkLead(u);

    const r = await request(app).post('/api/reminders').set(auth(t)).send({
      title:  'Follow up',
      dueDate: future(),
      leadId:  lead._id.toString(),
    });

    expect(r.status).toBe(201);
    expect(r.body.data.reminder.title).toBe('Follow up');
    expect(r.body.data.reminder.completed).toBe(false);
  });

  it('returns 404 when leadId does not belong to user', async () => {
    const u1 = await mkUser(7);  const t = await login(u1.email);
    const u2 = await mkUser(8);
    const foreignLead = await mkLead(u2);

    const r = await request(app).post('/api/reminders').set(auth(t)).send({
      title:  'Bad',
      dueDate: future(),
      leadId:  foreignLead._id.toString(),
    });

    expect(r.status).toBe(404);
  });

  it('returns 422 for missing title', async () => {
    const u = await mkUser(9); const t = await login(u.email);
    const lead = await mkLead(u);

    const r = await request(app).post('/api/reminders').set(auth(t)).send({
      dueDate: future(),
      leadId:  lead._id.toString(),
    });
    expect(r.status).toBe(422);
  });

  it('returns 422 for invalid dueDate', async () => {
    const u = await mkUser(10); const t = await login(u.email);
    const lead = await mkLead(u);

    const r = await request(app).post('/api/reminders').set(auth(t)).send({
      title: 'X', dueDate: 'not-a-date', leadId: lead._id.toString(),
    });
    expect(r.status).toBe(422);
  });

  it('returns 422 for invalid leadId', async () => {
    const u = await mkUser(11); const t = await login(u.email);
    const r = await request(app).post('/api/reminders').set(auth(t)).send({
      title: 'X', dueDate: future(), leadId: 'notanid',
    });
    expect(r.status).toBe(422);
  });
});

/* ══════════════════════════════════════════════════════════
   PATCH /api/reminders/:id/complete
   ══════════════════════════════════════════════════════════ */
describe('PATCH /api/reminders/:id/complete', () => {
  it('marks reminder as complete', async () => {
    const u = await mkUser(12); const t = await login(u.email);
    const lead = await mkLead(u);
    const rem = await Reminder.create({ title: 'X', dueDate: future(), lead: lead._id, owner: u._id });

    const r = await request(app)
      .patch(`/api/reminders/${rem._id}/complete`)
      .set(auth(t));

    expect(r.status).toBe(200);
    expect(r.body.data.reminder.completed).toBe(true);
    expect(r.body.data.reminder.completedAt).toBeTruthy();
  });

  it('returns 404 for other user\'s reminder', async () => {
    const u1 = await mkUser(13); const t = await login(u1.email);
    const u2 = await mkUser(14);
    const lead = await mkLead(u2);
    const rem = await Reminder.create({ title: 'X', dueDate: future(), lead: lead._id, owner: u2._id });

    const r = await request(app)
      .patch(`/api/reminders/${rem._id}/complete`)
      .set(auth(t));
    expect(r.status).toBe(404);
  });

  it('returns 422 for invalid mongo id', async () => {
    const u = await mkUser(15); const t = await login(u.email);
    const r = await request(app).patch('/api/reminders/badid/complete').set(auth(t));
    expect(r.status).toBe(422);
  });
});

/* ══════════════════════════════════════════════════════════
   DELETE /api/reminders/:id
   ══════════════════════════════════════════════════════════ */
describe('DELETE /api/reminders/:id', () => {
  it('deletes a reminder', async () => {
    const u = await mkUser(16); const t = await login(u.email);
    const lead = await mkLead(u);
    const rem = await Reminder.create({ title: 'D', dueDate: future(), lead: lead._id, owner: u._id });

    const r = await request(app).delete(`/api/reminders/${rem._id}`).set(auth(t));
    expect(r.status).toBe(200);
    expect(await Reminder.findById(rem._id)).toBeNull();
  });

  it('returns 404 for another user\'s reminder', async () => {
    const u1 = await mkUser(17); const t = await login(u1.email);
    const u2 = await mkUser(18);
    const lead = await mkLead(u2);
    const rem = await Reminder.create({ title: 'D', dueDate: future(), lead: lead._id, owner: u2._id });

    const r = await request(app).delete(`/api/reminders/${rem._id}`).set(auth(t));
    expect(r.status).toBe(404);
  });

  it('returns 422 for invalid id', async () => {
    const u = await mkUser(19); const t = await login(u.email);
    const r = await request(app).delete('/api/reminders/notanid').set(auth(t));
    expect(r.status).toBe(422);
  });
});
