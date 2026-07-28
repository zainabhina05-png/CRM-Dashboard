# LeadFlow CRM - Requirements Document

## Overview
Transform the existing LeadFlow CRM from its current state into a production-ready, secure, and distinctive customer relationship management platform. This project involves fixing deployment issues, implementing enterprise-grade security, establishing a design system, and ensuring comprehensive test coverage while maintaining feature parity with the existing implementation.

## Hard Constraints
- **Framework Preservation**: Keep MERN stack (MongoDB, Express, React, Node.js) - no framework rewrites
- **Feature Parity**: Every existing feature must continue working - no regressions allowed
- **Protected Routes**: Do not modify anything under `<<OTHER_SITE_PATH_OR_ROUTE>>` - ships as-is
- **Git Workflow**: All changes on feature branches with conventional commits, PR-based merging
- **Test Coverage**: Nothing goes to production without tests passing

## Phase 1: Requirements (EARS-style Acceptance Criteria)

### A. Authentication & Authorization

#### A1. Backend-Enforced Authentication
**Given** a user attempts to access protected API endpoints  
**When** they provide invalid or missing JWT tokens  
**Then** the server must return 401 Unauthorized and reject the request server-side  

**Given** a user successfully authenticates  
**When** they receive JWT access tokens  
**Then** tokens must expire in 15 minutes and be rotated with httpOnly refresh tokens lasting 7 days  

**Given** a refresh token is compromised or reused  
**When** the system detects token reuse  
**Then** all user sessions must be immediately revoked and user forced to re-authenticate  

#### A2. Password Security Standards
**Given** a user creates or updates their password  
**When** the password is processed  
**Then** it must be hashed with bcrypt salt rounds ≥12 and never returned in API responses  

**Given** a user attempts multiple failed login attempts  
**When** they exceed 5 attempts within 15 minutes  
**Then** their IP must be rate-limited and subsequent attempts blocked  

#### A3. Role-Based Access Control
**Given** the system has three user roles: admin, manager, sales_rep  
**When** users attempt role-restricted actions  
**Then** server-side middleware must enforce permissions:
- sales_rep: CRUD own leads, view own analytics
- manager: sales_rep permissions + CSV export + view team data  
- admin: manager permissions + user management + delete leads

**Given** a user's role is checked  
**When** authorization middleware runs  
**Then** role verification must occur server-side, never client-side only  

#### A4. Session Management
**Given** a user logs in successfully  
**When** they refresh the browser or navigate away  
**Then** their session must persist without requiring re-authentication  
**And** access tokens must be automatically refreshed before expiry  

### B. Demo Seed System

#### B1. Idempotent Seed Script
**Given** an administrator runs `npm run seed`  
**When** the command executes against any database  
**Then** it must safely wipe existing demo data and repopulate with fresh demo dataset  

**Given** the seed script runs  
**When** it generates demo data  
**Then** it must create:
- 3 demo users (one per role: admin, manager, sales_rep)
- 50-100 realistic leads using @faker-js/faker
- 20-30 reminders with varied due dates
- Complete relational integrity (activities reference real users, leads belong to correct owners)

#### B2. Production Safety Guards
**Given** the seed script is executed  
**When** NODE_ENV !== 'development' AND ALLOW_SEED !== 'true'  
**Then** the script must abort with error message and not touch the database  

**Given** demo credentials are generated  
**When** seed completes successfully  
**Then** credentials must be written to DEMO_CREDENTIALS.md in workspace root  

#### B3. Asset Management
**Given** an administrator runs `npm run seed:reset`  
**When** the command executes  
**Then** it must clear all demo data AND remove any uploaded demo assets  

### C. UI & Theming - Distinctive Design System

#### C1. Design Reference Adaptation
**Given** the Figma reference design (Planix CRM Dashboard UI Kit)  
**When** extracting design patterns  
**Then** use structural conventions only - spacing, component anatomy, information density  
**And** deliberately deviate in color system, typography, and specific styling to avoid template appearance  

#### C2. Design System Foundation
**Given** the need for consistent styling  
**When** implementing components  
**Then** establish design tokens in .kiro/steering/design-system.md:
- Color scale (primary, secondary, semantic colors)
- Spacing scale (4px base unit system)
- Typography scale (font families, sizes, weights)
- Border radius system
- Shadow system
- Component spacing patterns

**Given** any component requires styling  
**When** developers implement it  
**Then** all values must reference design tokens, not hardcoded values  

#### C3. Motion Design Standards
**Given** user interactions throughout the application  
**When** implementing animations with Framer Motion  
**Then** animations must be:
- Purposeful and enhance usability (no motion for motion's sake)
- Page/route transitions: smooth cross-fades
- List items (Kanban cards, table rows): enter/exit with stagger
- Modals/drawers: scale and opacity transitions
- Loading states: skeleton animations matching final layout
- Duration: 200-300ms for micro-interactions, 400-500ms for page transitions

#### C4. Responsive Design Requirements
**Given** users access the application on various devices  
**When** content is displayed at different viewport sizes  
**Then** layouts must reflow appropriately:
- Mobile (320-768px): Single column, collapsible navigation, touch-optimized
- Tablet (768-1024px): Condensed two-column layout, hybrid navigation
- Desktop (1024px+): Full multi-column dashboard layout
**And** data tables must become horizontally scrollable or stacked on mobile
**And** Kanban board must scroll horizontally on mobile with full column visibility

#### C5. Complete State Coverage
**Given** any UI component or screen  
**When** rendering content  
**Then** all possible states must be designed and implemented:
- Empty state: Helpful messaging and clear next actions
- Loading state: Skeleton screens matching final content structure  
- Error state: Clear error messages with retry options
- Populated state: Proper data display with appropriate density
**And** states must transition smoothly between each other  

#### C6. Dark Mode Support
**Given** the current application has glassmorphism styling  
**When** evaluating dark mode requirements  
**Then** implement dark mode toggle if existing CSS already has dark variants  
**Otherwise** mark as optional for future implementation  

### D. Testing Requirements

#### D1. Backend Test Coverage
**Given** all API routes exist  
**When** running backend test suite  
**Then** every route must have Jest + Supertest coverage including:
- Authentication: login, register, refresh, logout (positive and negative cases)
- CRUD operations: leads, reminders, users (all HTTP methods)
- Authorization: role-based access attempts (forbidden scenarios)
- Input validation: invalid payloads, missing fields, malformed data
- Error handling: 404s, 500s, database connection failures

#### D2. Frontend Test Coverage  
**Given** React components exist  
**When** running frontend test suite with React Testing Library  
**Then** key components must be tested:
- Authentication forms: login/register validation, error display
- Protected routes: redirect behavior for unauthenticated users  
- CRUD forms: lead creation/editing, form validation
- Kanban board: drag functionality, status updates
- Navigation: menu items, role-based visibility

#### D3. End-to-End Test Suite
**Given** the complete application workflow  
**When** running E2E tests with [Playwright OR Cypress - choice justified in design.md]  
**Then** critical user journeys must be covered:
- User registration → email verification → first login
- Lead creation → status progression through pipeline → completion
- User logout → session expiry → forced re-authentication
**And** tests must run in CI environment, not just locally

#### D4. Coverage Thresholds
**Given** the test suite runs  
**When** calculating coverage metrics  
**Then** minimum coverage must be achieved:
- Backend: 75% line coverage (excluding generated files)
- Frontend: 70% component coverage (excluding trivial components)
- E2E: 100% critical path coverage (auth + main CRUD flow)
**And** coverage must be enforced in CI - failing builds if thresholds not met

#### D5. Pre-existing Feature Testing
**Given** the Phase 0 feature inventory  
**When** implementing new tests  
**Then** every existing feature must have at least one test proving continued functionality:
- Dashboard analytics display
- Lead table pagination and filtering  
- Kanban drag-and-drop
- Reminder creation and management
- Activity timeline logging
- CSV export functionality
- Webhook lead capture

### E. Performance & Optimization

#### E1. Database Query Optimization
**Given** MongoDB queries for lead data  
**When** fetching lists or performing aggregations  
**Then** all queries must be optimized:
- Pagination implemented on all list endpoints (not just frontend)
- Indexes created for common query patterns (owner + status, owner + tags)
- Aggregation pipelines optimized with proper $match early filtering
- No unbounded find() operations without limits

#### E2. Frontend Performance  
**Given** the React application bundle  
**When** building for production  
**Then** optimization requirements:
- Route-based code splitting beyond current lazy loading
- Heavy libraries (Recharts, @dnd-kit) loaded only when needed
- Memoization applied to expensive calculations and renders
- Bundle analyzer used to identify and remove unused dependencies

#### E3. Caching Strategy
**Given** frequently requested data  
**When** users navigate the application  
**Then** implement appropriate caching:
- API response caching for analytics data (5-minute TTL)
- Memoized selectors for derived data calculations
- Browser caching headers for static assets

#### E4. Performance Monitoring
**Given** the deployed application  
**When** running Lighthouse audit  
**Then** performance scores must meet:
- Performance: ≥80
- Accessibility: ≥90  
- Best Practices: ≥90
- SEO: ≥80
**And** before/after performance metrics documented

### F. Deployment & Infrastructure

#### F1. Deployment Issue Resolution
**Given** current 404 errors on deployed URLs  
**When** investigating deployment configuration  
**Then** identify and fix root cause:
- Verify Vercel project configuration (build commands, output directories)
- Confirm environment variables set in Vercel project settings
- Validate serverless function setup for Express API
- Test deployment process end-to-end

#### F2. Environment Configuration
**Given** the application requires secrets and configuration  
**When** deploying to any environment  
**Then** security requirements:
- All secrets in environment variables, never committed to git
- .env.example files contain all required variables with safe placeholder values
- Production builds use different secrets than development/test
- Database URLs properly configured for each environment

#### F3. Deployment Architecture
**Given** the Vercel hosting platform  
**When** deploying frontend and backend  
**Then** architecture must be documented:
- Frontend: Static site with SPA routing
- Backend: Serverless functions OR traditional server (decision justified in design.md)
- Database: MongoDB Atlas with connection pooling
- CDN: Vercel Edge Network for asset delivery

#### F4. Deployment Verification
**Given** a successful deployment  
**When** the application is live  
**Then** end-to-end verification must confirm:
- All routes respond correctly (no 404s)
- Demo login credentials work
- Database connectivity established
- Environment variables properly loaded
- All features from Phase 0 inventory functional

### G. Kanban Pipeline Security

#### G1. Server-Side Authorization
**Given** a user attempts to move a Kanban card  
**When** the drag-and-drop triggers a status update API call  
**Then** the server must independently verify:
- User is authenticated (valid JWT)
- User has permission to modify leads (role check)  
- User owns the lead OR is assigned to it OR has admin role
- Lead ID in request belongs to user's accessible leads (IDOR protection)

#### G2. State Transition Validation  
**Given** defined pipeline stages: New → Contacted → Qualified → Proposal → Won/Lost  
**When** a status change is requested  
**Then** server must enforce business rules:
- Valid transitions only (define skip rules in design.md: allow/disallow jumping stages)
- New status value is within allowed LEAD_STATUSES enum
- Status change logged in activity timeline with user attribution

#### G3. Role-Based Stage Restrictions
**Given** terminal pipeline actions (Won/Lost, Delete card)  
**When** users attempt these operations  
**Then** restrict based on role:
- sales_rep: Can move own leads through all stages  
- manager: sales_rep permissions + can close deals as Won/Lost
- admin: full pipeline permissions including deletion
**And** unauthorized attempts return 403 Forbidden with clear error message

#### G4. Input Sanitization
**Given** card content updates (titles, descriptions, notes)  
**When** data is submitted to the server  
**Then** all input must be sanitized:
- HTML entity encoding to prevent stored XSS
- Maximum length validation (title: 100 chars, notes: 500 chars)
- Prohibited script tags and dangerous HTML removed
- Markdown rendering (if supported) must be safe

#### G5. Concurrency Safety
**Given** multiple users can access the same Kanban board  
**When** simultaneous updates occur  
**Then** implement optimistic concurrency control:
- Include version/updatedAt field in Lead model
- Check version on updates to detect stale data
- Return 409 Conflict if version mismatch detected
- Client must refetch current state on conflict

#### G6. Real-Time Channel Authentication (if applicable)
**Given** the board uses WebSocket/live updates  
**When** establishing socket connections  
**Then** security requirements:
- JWT token validation on socket connection
- Users subscribed only to boards they can access
- No broadcasting of updates to unauthorized clients
- Socket session tied to HTTP session lifecycle

#### G7. Rate Limiting & Abuse Prevention  
**Given** the stage-update API endpoint  
**When** processing status change requests  
**Then** implement protection:
- Rate limit: maximum 30 status changes per minute per user
- Audit logging: who moved what lead from which stage to which stage, when
- Prevent automated/scripted abuse of status changes

#### G8. Security Test Requirements
**Given** Kanban security implementation  
**When** running security tests  
**Then** verify protection against:
- Unauthorized card moves (user tries to move lead they don't own) → expect 403/404
- Invalid stage transitions (if rules defined) → expect 400 Bad Request  
- Unauthenticated requests to status update endpoint → expect 401
- SQL injection attempts in card content → expect sanitized storage
- Concurrent modification conflicts → expect 409 handling

## Acceptance Criteria Summary

### Must Have (P0)
- [ ] All existing features continue working (feature parity)
- [ ] Backend JWT authentication with proper token rotation  
- [ ] Server-side authorization middleware for all protected routes
- [ ] Kanban pipeline with complete security implementation (G1-G8)
- [ ] Idempotent demo seed system with production safety guards
- [ ] Design system tokens established and consistently applied
- [ ] Test coverage: 75% backend, 70% frontend, 100% critical E2E paths
- [ ] Deployment 404 issues resolved with working live demo

### Should Have (P1)  
- [ ] Framer Motion animations following motion design standards
- [ ] Responsive design across mobile/tablet/desktop breakpoints
- [ ] Performance optimizations (code splitting, caching, bundle size)
- [ ] Complete state coverage (empty, loading, error, populated)
- [ ] Rate limiting and abuse prevention on sensitive endpoints

### Could Have (P2)
- [ ] Dark mode implementation (if existing CSS supports it)
- [ ] Real-time WebSocket updates for Kanban board
- [ ] Advanced audit logging for security events
- [ ] Additional performance monitoring and alerting

## Success Metrics
- Zero regressions in existing functionality
- All security tests pass including OWASP top 10 protections
- Lighthouse performance score ≥80 across all metrics
- Demo deployment accessible and fully functional
- Complete documentation in DEMO_CREDENTIALS.md
- CI/CD pipeline with enforced quality gates

## Risk Mitigation
- **Feature Regression**: Comprehensive testing of existing features before any modifications
- **Security Gaps**: Security-first development with tests for each security requirement
- **Performance Degradation**: Baseline performance measurement before optimization work
- **Deployment Issues**: Staged deployment with verification at each step
- **Design Consistency**: Design system establishment before component work begins