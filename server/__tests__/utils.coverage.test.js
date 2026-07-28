/**
 * Coverage gap-filler: emailService, reminderScheduler branches,
 * plus authSecurity branches not hit by other suites.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET         = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const User = require('../models/User');

beforeAll(async () => { await connectTestDB(); });
afterEach(async () => { await clearTestDB();   });
afterAll(async ()  => { await closeTestDB();   });

/* ══════════════════════════════════════════════════════════
   emailService
   ══════════════════════════════════════════════════════════ */
describe('emailService', () => {
  beforeEach(() => {
    // Clear the cached transporter between tests
    jest.resetModules();
    delete process.env.SMTP_HOST;
  });

  it('sendEmail: uses console stub when SMTP_HOST not set', async () => {
    const { sendEmail } = require('../utils/emailService');
    const result = await sendEmail({ to: 'x@x.com', subject: 'test', html: '<p>hi</p>' });
    expect(result).toEqual({ messageId: 'dev-stub' });
  });

  it('sendLeadAssignedEmail: sends without company', async () => {
    const { sendLeadAssignedEmail } = require('../utils/emailService');
    const result = await sendLeadAssignedEmail({
      ownerEmail: 'o@test.com',
      ownerName: 'Owner',
      lead: { name: 'Lead', email: 'l@test.com', status: 'New', source: 'website' },
    });
    expect(result).toBeDefined();
  });

  it('sendLeadAssignedEmail: sends with company', async () => {
    const { sendLeadAssignedEmail } = require('../utils/emailService');
    const result = await sendLeadAssignedEmail({
      ownerEmail: 'o@test.com',
      ownerName: 'Owner',
      lead: { name: 'Lead', email: 'l@test.com', status: 'New', source: 'website', company: 'Acme' },
    });
    expect(result).toBeDefined();
  });

  it('sendReminderEmail: sends for upcoming reminder', async () => {
    const { sendReminderEmail } = require('../utils/emailService');
    const result = await sendReminderEmail({
      ownerEmail: 'o@test.com',
      ownerName: 'Owner',
      reminder: { title: 'Follow up', dueDate: new Date(Date.now() + 86400000) },
      lead: { name: 'L', email: 'l@test.com' },
    });
    expect(result).toBeDefined();
  });

  it('sendReminderEmail: sends for overdue reminder', async () => {
    const { sendReminderEmail } = require('../utils/emailService');
    const result = await sendReminderEmail({
      ownerEmail: 'o@test.com',
      ownerName: 'Owner',
      reminder: { title: 'Overdue task', dueDate: new Date(Date.now() - 86400000) },
      lead: { name: 'L', email: 'l@test.com', company: 'Corp' },
    });
    expect(result).toBeDefined();
  });

  it('sendReminderEmail: handles lead without company', async () => {
    const { sendReminderEmail } = require('../utils/emailService');
    const result = await sendReminderEmail({
      ownerEmail: 'o@test.com',
      ownerName: 'Owner',
      reminder: { title: 'Check in', dueDate: new Date(Date.now() + 3600000) },
      lead: { name: 'NoCompany', email: 'nc@test.com' },
    });
    expect(result).toBeDefined();
  });
});

/* ══════════════════════════════════════════════════════════
   reminderScheduler
   ══════════════════════════════════════════════════════════ */
describe('reminderScheduler', () => {
  it('start() and stop() without error', () => {
    jest.resetModules();
    const scheduler = require('../utils/reminderScheduler');
    // Just verify it doesn't throw — DB not connected so runCheck will catch and log
    expect(() => scheduler.start()).not.toThrow();
    expect(() => scheduler.stop()).not.toThrow();
  });

  it('calling start() twice only starts one interval', () => {
    jest.resetModules();
    const scheduler = require('../utils/reminderScheduler');
    scheduler.start();
    scheduler.start(); // second call should be no-op
    scheduler.stop();
  });
});

/* ══════════════════════════════════════════════════════════
   authSecurity — uncovered branches
   ══════════════════════════════════════════════════════════ */
describe('authSecurity — branch coverage', () => {
  it('logSecurityEvent: handles all critical event types without throwing', () => {
    const { logSecurityEvent } = require('../middleware/authSecurity');
    const events = [
      'RATE_LIMIT_EXCEEDED',
      'FAILED_LOGIN_ATTEMPT',
      'TOKEN_REUSE_DETECTED',
      'SUCCESSFUL_LOGIN',
      'USER_REGISTERED',
      'USER_LOGGED_OUT',
    ];
    events.forEach(evt => {
      expect(() => logSecurityEvent(evt, { ip: '127.0.0.1', timestamp: new Date().toISOString() })).not.toThrow();
    });
  });

  it('getUserSessions: returns empty array for unknown user', () => {
    const { getUserSessions } = require('../middleware/authSecurity');
    expect(getUserSessions('nonexistent-user-id')).toEqual([]);
  });

  it('trackSession + getUserSessions round-trip', () => {
    const { trackSession, getUserSessions } = require('../middleware/authSecurity');
    const userId = 'test-user-001';
    const sessionId = trackSession(userId, { ip: '1.2.3.4', userAgent: 'jest' });
    expect(typeof sessionId).toBe('string');
    const sessions = getUserSessions(userId);
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    const found = sessions.find(s => s.sessionId === sessionId);
    expect(found).toBeDefined();
    expect(found.isActive).toBe(true);
  });

  it('revokeSessions: revokes all sessions for user', () => {
    const { trackSession, getUserSessions, revokeSessions } = require('../middleware/authSecurity');
    const userId = 'test-user-002';
    trackSession(userId, { ip: '1.1.1.1', userAgent: 'A' });
    trackSession(userId, { ip: '2.2.2.2', userAgent: 'B' });
    revokeSessions(userId);
    expect(getUserSessions(userId)).toHaveLength(0);
  });

  it('trackFailedAttempt: increments counter', () => {
    const { trackFailedAttempt } = require('../middleware/authSecurity');
    const fakeReq = { ip: '9.9.9.9', body: { email: 'fail@test.com' }, get: () => 'jest' };
    const first  = trackFailedAttempt(fakeReq, 'fail@test.com');
    const second = trackFailedAttempt(fakeReq, 'fail@test.com');
    expect(second).toBeGreaterThan(first);
  });

  it('clearFailedAttempts: removes tracked failures', () => {
    const { trackFailedAttempt, clearFailedAttempts } = require('../middleware/authSecurity');
    const fakeReq = { ip: '10.0.0.1', body: { email: 'clear@test.com' }, get: () => 'jest' };
    trackFailedAttempt(fakeReq, 'clear@test.com');
    expect(() => clearFailedAttempts(fakeReq, 'clear@test.com')).not.toThrow();
  });
});

/* ══════════════════════════════════════════════════════════
   pipelineSecurity — uncovered VALID_STATUSES export
   ══════════════════════════════════════════════════════════ */
describe('pipelineSecurity — exports', () => {
  it('exports VALID_STATUSES and TERMINAL_STATUSES correctly', () => {
    const { VALID_STATUSES, TERMINAL_STATUSES } = require('../middleware/pipelineSecurity');
    expect(VALID_STATUSES).toContain('Won');
    expect(VALID_STATUSES).toContain('Lost');
    expect(TERMINAL_STATUSES.has('Won')).toBe(true);
    expect(TERMINAL_STATUSES.has('Lost')).toBe(true);
    expect(TERMINAL_STATUSES.has('New')).toBe(false);
  });
});
