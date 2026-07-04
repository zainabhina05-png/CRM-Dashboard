/**
 * Unit tests for utility functions — no HTTP, no DB needed.
 */
process.env.NODE_ENV = 'test';

const { normalizePhone, findDuplicates } = require('../utils/duplicateDetection');

/* ── normalizePhone ──────────────────────────────────────── */
describe('normalizePhone', () => {
  it('strips all non-digits', () => {
    expect(normalizePhone('+1 (555) 000-1234')).toBe('15550001234');
  });

  it('handles empty string', () => {
    expect(normalizePhone('')).toBe('');
  });

  it('handles null/undefined gracefully', () => {
    expect(normalizePhone(null)).toBe('');
    expect(normalizePhone(undefined)).toBe('');
  });

  it('preserves a plain digit string', () => {
    expect(normalizePhone('5551234567')).toBe('5551234567');
  });
});

/* ── findDuplicates (unit-level with mock Lead model) ────── */
describe('findDuplicates', () => {
  const buildMockLead = (overrides = {}) => ({
    _id: 'abc123',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '5551234567',
    company: 'Acme',
    status: 'New',
    createdAt: new Date(),
    ...overrides,
  });

  const mockLeadModel = (results) => ({
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(results),
    }),
  });

  it('returns empty array when no conditions can be built', async () => {
    const MockLead = mockLeadModel([]);
    const result = await findDuplicates(MockLead, 'owner1', {});
    expect(result).toEqual([]);
    expect(MockLead.find).not.toHaveBeenCalled();
  });

  it('returns empty array when no duplicates found', async () => {
    const MockLead = mockLeadModel([]);
    const result = await findDuplicates(MockLead, 'owner1', {
      email: 'jane@example.com',
    });
    expect(result).toEqual([]);
  });

  it('returns duplicates with matchReason=email on exact email match', async () => {
    const dupe = buildMockLead();
    const MockLead = mockLeadModel([dupe]);
    const result = await findDuplicates(MockLead, 'owner1', {
      email: 'jane@example.com',
    });
    expect(result).toHaveLength(1);
    expect(result[0].matchReason).toBe('email');
  });

  it('returns matchReason=phone on phone match', async () => {
    const dupe = buildMockLead({ email: 'other@example.com' });
    const MockLead = mockLeadModel([dupe]);
    const result = await findDuplicates(MockLead, 'owner1', {
      phone: '5551234567',
    });
    expect(result).toHaveLength(1);
    expect(result[0].matchReason).toBe('phone');
  });

  it('returns matchReason=name_company on name+company match', async () => {
    const dupe = buildMockLead({ email: 'other@example.com', phone: '' });
    const MockLead = mockLeadModel([dupe]);
    const result = await findDuplicates(MockLead, 'owner1', {
      name: 'Jane Smith',
      company: 'Acme',
    });
    expect(result).toHaveLength(1);
    expect(result[0].matchReason).toBe('name_company');
  });

  it('excludes the lead with excludeId', async () => {
    const MockLead = mockLeadModel([]);
    await findDuplicates(MockLead, 'owner1', {
      email: 'jane@example.com',
      excludeId: 'abc123',
    });
    const filterArg = MockLead.find.mock.calls[0][0];
    expect(filterArg._id).toEqual({ $ne: 'abc123' });
  });
});
