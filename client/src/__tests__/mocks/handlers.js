import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:5000/api';

/* ── Auth fixtures ───────────────────────────────────────── */
export const adminUser = {
  _id: '000000000000000000000001',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'admin',
};

export const salesRepUser = {
  _id: '000000000000000000000002',
  name: 'Sales Rep',
  email: 'rep@test.com',
  role: 'sales_rep',
};

export const mockToken = 'mock.jwt.token';

/* ── Lead fixtures ───────────────────────────────────────── */
export const mockLeads = [
  {
    _id: 'lead001',
    name: 'Alice Smith',
    email: 'alice@example.com',
    company: 'Acme Corp',
    status: 'New',
    source: 'website',
    tags: ['hot'],
    notes: '',
    activities: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    __v: 0,
  },
  {
    _id: 'lead002',
    name: 'Bob Jones',
    email: 'bob@example.com',
    company: 'BetaCo',
    status: 'Contacted',
    source: 'referral',
    tags: [],
    notes: 'Called twice',
    activities: [],
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    __v: 0,
  },
];

export const mockAnalytics = {
  counts: { New: 5, Contacted: 3, Qualified: 2, Proposal: 1, Won: 4, Lost: 2 },
  total: 17,
  bySource: [{ source: 'website', count: 8 }, { source: 'referral', count: 5 }],
  winRate: 67,
  lossRate: 33,
  trend: [],
};

/* ── Handler definitions ─────────────────────────────────── */
export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'admin@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        message: 'Login successful',
        data: { user: adminUser, token: mockToken, sessionId: 'sess001' },
      });
    }
    if (body.email === 'rep@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        message: 'Login successful',
        data: { user: salesRepUser, token: mockToken, sessionId: 'sess002' },
      });
    }
    return HttpResponse.json(
      { success: false, message: 'Invalid email or password', data: null },
      { status: 401 }
    );
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json();
    if (!body.name || !body.email || !body.password) {
      return HttpResponse.json(
        { success: false, message: 'Validation failed', data: null },
        { status: 422 }
      );
    }
    return HttpResponse.json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { ...salesRepUser, name: body.name, email: body.email },
        token: mockToken,
        sessionId: 'sess003',
      },
    }, { status: 201 });
  }),

  http.post(`${BASE}/auth/logout`, () =>
    HttpResponse.json({ success: true, message: 'Logged out successfully', data: null })
  ),

  http.get(`${BASE}/auth/me`, ({ request }) => {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json({ success: false, message: 'Not authorized', data: null }, { status: 401 });
    }
    return HttpResponse.json({
      success: true,
      message: 'User profile retrieved',
      data: { user: adminUser },
    });
  }),

  http.post(`${BASE}/auth/refresh`, () =>
    HttpResponse.json({
      success: true,
      message: 'Token refreshed',
      data: { token: mockToken, user: adminUser },
    })
  ),

  // Leads
  http.get(`${BASE}/leads`, () =>
    HttpResponse.json({
      success: true,
      message: 'Leads retrieved successfully',
      data: {
        leads: mockLeads,
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      },
    })
  ),

  http.get(`${BASE}/leads/analytics`, () =>
    HttpResponse.json({
      success: true,
      message: 'Analytics retrieved successfully',
      data: mockAnalytics,
    })
  ),

  http.get(`${BASE}/leads/kanban`, () => {
    const grouped = { New: [mockLeads[0]], Contacted: [mockLeads[1]], Qualified: [], Proposal: [], Won: [], Lost: [] };
    return HttpResponse.json({
      success: true,
      message: 'Kanban data retrieved successfully',
      data: { grouped, total: 2 },
    });
  }),

  http.post(`${BASE}/leads/check-duplicates`, () =>
    HttpResponse.json({
      success: true,
      message: 'No duplicates found',
      data: { duplicates: [], hasDuplicates: false },
    })
  ),

  http.post(`${BASE}/leads`, async ({ request }) => {
    const body = await request.json();
    if (!body.name || !body.email) {
      return HttpResponse.json(
        { success: false, message: 'Validation failed', data: null },
        { status: 422 }
      );
    }
    return HttpResponse.json({
      success: true,
      message: 'Lead created successfully',
      data: {
        lead: { _id: 'lead_new', ...body, status: 'New', activities: [], __v: 0 },
      },
    }, { status: 201 });
  }),

  http.patch(`${BASE}/leads/:id/status`, ({ params }) =>
    HttpResponse.json({
      success: true,
      message: 'Lead status updated successfully',
      data: { lead: { ...mockLeads[0], _id: params.id, status: 'Contacted' } },
    })
  ),

  http.put(`${BASE}/leads/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      message: 'Lead updated successfully',
      data: { lead: { ...mockLeads[0], _id: params.id, ...body } },
    });
  }),

  http.delete(`${BASE}/leads/:id`, () =>
    HttpResponse.json({ success: true, message: 'Lead deleted successfully', data: null })
  ),

  // Reminders
  http.get(`${BASE}/reminders`, () =>
    HttpResponse.json({
      success: true,
      message: 'Reminders retrieved',
      data: { reminders: [] },
    })
  ),

  http.get(`${BASE}/reminders/summary`, () =>
    HttpResponse.json({
      success: true,
      message: 'Reminder summary retrieved',
      data: { overdue: 1, dueToday: 2, dueThisWeek: 3 },
    })
  ),
];
