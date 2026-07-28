# LeadFlow CRM - Testing Standards

## Testing Philosophy

LeadFlow follows a comprehensive testing strategy that ensures reliability, security, and maintainability. Testing is not optional - it's a prerequisite for any code reaching production. The testing approach emphasizes security testing, API contract validation, and user workflow verification over mere code coverage metrics.

## Testing Stack & Tools

### Backend Testing
- **Test Runner**: Jest 29.7.0
- **HTTP Testing**: Supertest 7.1.0  
- **Test Environment**: Node.js with isolated test database
- **Database**: MongoDB with dedicated `leadflow_test` database
- **Mocking**: Jest built-in mocking capabilities

### Frontend Testing  
- **Test Runner**: Jest with Vite integration
- **React Testing**: React Testing Library
- **User Interaction**: @testing-library/user-event
- **Component Testing**: Render + assertion pattern
- **Mocking**: MSW (Mock Service Worker) for API mocking

### End-to-End Testing
**Framework Selection** (Choose one, justify in design.md):
- **Playwright**: Cross-browser testing, reliable selectors, screenshot comparison
- **Cypress**: Developer-friendly API, time-travel debugging, real browser testing

**Selection Criteria**:
- **Playwright** if cross-browser compatibility is critical
- **Cypress** if development experience and debugging capabilities are prioritized

## Coverage Requirements

### Minimum Coverage Thresholds
```javascript
// jest.config.js coverage thresholds
module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    },
    // Stricter requirements for security-critical files
    './server/middleware/auth.js': {
      branches: 90,
      functions: 90, 
      lines: 90,
      statements: 90
    },
    './server/routes/auth.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
}
```

### Coverage Exclusions
- Configuration files (`*.config.js`, `vite.config.js`)
- Build output (`dist/`, `build/`)
- Test files (`*.test.js`, `*.spec.js`)
- Type definitions (`*.d.ts`)
- Generated files

## Backend Testing Standards

### Test File Organization
```
server/__tests__/
├── setup.js              # Test database setup/teardown
├── auth.test.js          # Authentication & authorization
├── leads.test.js         # Lead CRUD operations  
├── reminders.test.js     # Reminder functionality
├── webhooks.test.js      # Webhook endpoints
├── security.test.js      # Security-specific tests
└── utils.test.js         # Utility function tests
```

### Database Testing Pattern
```javascript
// Standard test setup pattern
beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  // Clean database after each test for isolation
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});
```

### Authentication Test Coverage Requirements
**Must Test**:
- [ ] User registration with valid/invalid data
- [ ] Login with correct/incorrect credentials  
- [ ] JWT token generation and expiration
- [ ] Refresh token rotation and reuse detection
- [ ] Password hashing verification (bcrypt)
- [ ] Rate limiting on auth endpoints
- [ ] Logout functionality and token revocation
- [ ] Protected route access with/without valid tokens
- [ ] Role-based authorization (admin, manager, sales_rep)

### CRUD Testing Pattern
```javascript
describe('Lead CRUD Operations', () => {
  let authToken, testUser;

  beforeEach(async () => {
    // Create test user and authenticate
    testUser = await createTestUser();
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'password123' });
    authToken = loginRes.body.data.token;
  });

  describe('POST /api/leads', () => {
    it('creates lead with valid data', async () => {
      const leadData = { name: 'Test Lead', email: 'test@example.com' };
      
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(leadData);
        
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lead.owner).toBe(testUser._id.toString());
    });

    it('rejects creation without authentication', async () => {
      const leadData = { name: 'Test Lead', email: 'test@example.com' };
      
      const res = await request(app)
        .post('/api/leads')
        .send(leadData);
        
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
```

### Security Test Requirements
**Kanban Pipeline Security Tests** (Phase 1G Requirements):
```javascript
describe('Kanban Security', () => {
  it('prevents unauthorized lead status changes', async () => {
    const otherUser = await createTestUser({ email: 'other@example.com' });
    const lead = await createTestLead({ owner: otherUser._id });
    
    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'Won' });
      
    expect(res.status).toBe(404); // Lead not found (ownership check)
  });

  it('validates status transitions', async () => {
    const lead = await createTestLead({ owner: testUser._id, status: 'New' });
    
    const res = await request(app)
      .patch(`/api/leads/${lead._id}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'InvalidStatus' });
      
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid status/i);
  });

  it('enforces role-based terminal actions', async () => {
    // Test that sales_rep cannot delete leads
    const lead = await createTestLead({ owner: testUser._id });
    
    const res = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(res.status).toBe(403); // Forbidden for sales_rep role
  });
});
```

## Frontend Testing Standards

### Component Testing Structure
```
client/src/__tests__/
├── components/
│   ├── KanbanBoard.test.jsx
│   ├── LeadModal.test.jsx
│   ├── LeadTable.test.jsx
│   └── ProtectedRoute.test.jsx
├── pages/
│   ├── Dashboard.test.jsx
│   ├── Login.test.jsx
│   └── Pipeline.test.jsx
├── hooks/
│   ├── useLeads.test.js
│   └── useAuth.test.js
└── services/
    └── api.test.js
```

### React Testing Library Patterns
```javascript
// Component testing template
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../context/AuthContext';
import LeadModal from '../components/LeadModal';

const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('LeadModal', () => {
  it('validates required fields on submission', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    
    renderWithProviders(
      <LeadModal isOpen={true} onSubmit={onSubmit} />
    );
    
    const submitButton = screen.getByRole('button', { name: /save lead/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid lead data', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    
    renderWithProviders(
      <LeadModal isOpen={true} onSubmit={onSubmit} />
    );
    
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /save lead/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
  });
});
```

### Authentication Flow Testing
```javascript
describe('Authentication Flow', () => {
  it('redirects unauthenticated users to login', () => {
    renderWithProviders(
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    );
    
    expect(screen.getByRole('form', { name: /login/i })).toBeInTheDocument();
  });

  it('allows authenticated users to access protected content', () => {
    const mockUser = { name: 'Test User', role: 'sales_rep' };
    
    renderWithProviders(
      <AuthProvider initialUser={mockUser}>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </AuthProvider>
    );
    
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: /login/i })).not.toBeInTheDocument();
  });
});
```

## End-to-End Testing Standards

### Critical User Journeys
**Must Cover (100% E2E Coverage)**:
1. **Authentication Journey**: Registration → Login → Dashboard → Logout
2. **Lead Management Journey**: Create Lead → Edit Details → Move Through Pipeline → Mark as Won/Lost
3. **Security Journey**: Unauthorized Access Attempts → Proper Rejection

### E2E Test Structure (Playwright Example)
```javascript
// tests/e2e/critical-flows.spec.js
import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  test('complete lead lifecycle', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=password-input]', 'password123');
    await page.click('[data-testid=login-button]');
    
    // Verify dashboard access
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Create new lead
    await page.click('[data-testid=add-lead-button]');
    await page.fill('[data-testid=lead-name]', 'E2E Test Lead');
    await page.fill('[data-testid=lead-email]', 'e2e@test.com');
    await page.click('[data-testid=save-lead]');
    
    // Verify lead appears in pipeline
    await page.goto('/pipeline');
    await expect(page.locator('[data-testid=kanban-card]')).toContainText('E2E Test Lead');
    
    // Move through pipeline stages
    await page.dragAndDrop(
      '[data-testid=kanban-card]:has-text("E2E Test Lead")',
      '[data-testid=kanban-column-Contacted]'
    );
    
    // Verify status change
    await expect(
      page.locator('[data-testid=kanban-column-Contacted] [data-testid=kanban-card]')
    ).toContainText('E2E Test Lead');
    
    // Logout
    await page.click('[data-testid=user-menu]');
    await page.click('[data-testid=logout-button]');
    await expect(page.locator('form')).toBeVisible(); // Back to login
  });

  test('security: unauthorized access prevention', async ({ page }) => {
    // Attempt to access protected route without authentication
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page.url()).toContain('/login');
    
    // Verify protected content not accessible
    await page.goto('/api/leads');
    const response = await page.waitForResponse('/api/leads');
    expect(response.status()).toBe(401);
  });
});
```

## CI/CD Testing Pipeline

### GitHub Actions Workflow (Example)
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd server && npm ci
      - name: Run tests
        run: cd server && npm test
        env:
          NODE_ENV: test
          MONGO_URI: mongodb://localhost:27017/leadflow_test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd client && npm ci
      - name: Run tests
        run: cd client && npm test

  test-e2e:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install Playwright
        run: npx playwright install
      - name: Run E2E tests
        run: npx playwright test
```

## Test Data Management

### Test User Creation
```javascript
// Utility for creating test users with different roles
const createTestUser = async (overrides = {}) => {
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'sales_rep',
    ...overrides
  };
  
  return await User.create(userData);
};

const createAdminUser = () => createTestUser({ 
  email: 'admin@example.com', 
  role: 'admin' 
});

const createManagerUser = () => createTestUser({ 
  email: 'manager@example.com', 
  role: 'manager' 
});
```

### Test Data Factory
```javascript
// Factory for generating realistic test data
const LeadFactory = {
  build: (overrides = {}) => ({
    name: 'Test Lead',
    email: 'lead@example.com',
    phone: '+1234567890',
    company: 'Test Company',
    status: 'New',
    source: 'website',
    tags: ['test'],
    notes: 'Test lead for automation',
    ...overrides
  }),
  
  create: async (user, overrides = {}) => {
    const leadData = LeadFactory.build(overrides);
    return await Lead.create({
      ...leadData,
      owner: user._id,
      activities: [{
        type: 'created',
        content: 'Lead created for testing',
        createdBy: user._id
      }]
    });
  }
};
```

## Pre-Merge Testing Requirements

### Automated Quality Gates
Before any PR can be merged to main:

1. **Unit Tests**: All backend and frontend tests must pass
2. **Coverage**: Coverage thresholds must be met
3. **E2E Tests**: Critical user journeys must pass
4. **Security Tests**: All Kanban security tests must pass
5. **Linting**: Code style and formatting must be consistent
6. **Build**: Production builds must succeed

### Manual Testing Checklist
For significant features or security changes:

- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Verify responsive design on mobile/tablet/desktop
- [ ] Test with screen readers for accessibility
- [ ] Verify all existing features still work (regression testing)
- [ ] Test error scenarios and edge cases
- [ ] Validate security measures with manual penetration testing

## Existing Feature Testing Requirements

Based on Phase 0 feature inventory, ensure tests exist for:

- [ ] Dashboard analytics display and data accuracy
- [ ] Lead table pagination, sorting, and filtering
- [ ] Kanban drag-and-drop functionality
- [ ] Lead CRUD operations (create, read, update, delete)
- [ ] Activity timeline logging and display
- [ ] Reminder creation, editing, and completion
- [ ] CSV export functionality for managers/admins
- [ ] Webhook lead capture and duplicate prevention
- [ ] User authentication and role-based permissions
- [ ] Search functionality across leads
- [ ] Custom fields and tags management

## Performance Testing

### Load Testing Requirements
- API endpoints must handle 100 concurrent users
- Database queries must complete within 500ms for typical datasets
- Frontend must achieve Lighthouse performance score ≥80

### Regression Testing
- Performance metrics tracked before/after changes
- Database query plans analyzed for optimization opportunities
- Bundle size monitored to prevent bloat

This testing strategy ensures LeadFlow maintains high quality, security, and reliability standards while supporting rapid development and deployment cycles.