# LeadFlow CRM - Technical Architecture

## Confirmed Technology Stack

### Frontend Stack
- **React**: 19.2.6 (latest stable)
- **Build Tool**: Vite 8.0.12 
- **Routing**: React Router DOM 7.15.1
- **HTTP Client**: Axios 1.16.1
- **Drag & Drop**: @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0
- **Charts**: Recharts 3.1.0
- **Styling**: Vanilla CSS (no component library)
- **State Management**: React Context (AuthContext, ToastContext)

### Backend Stack  
- **Runtime**: Node.js (latest LTS)
- **Framework**: Express 4.21.0
- **Database**: MongoDB with Mongoose 8.6.0
- **Authentication**: jsonwebtoken 9.0.2, bcryptjs 2.4.3
- **Security**: helmet 7.1.0, cors 2.8.5, express-rate-limit 7.4.0
- **Validation**: express-validator 7.2.0
- **Logging**: Winston 3.17.0, Morgan 1.10.0
- **Email**: Nodemailer 6.9.16

### Development & Testing
- **Testing**: Jest 29.7.0, Supertest 7.1.0, React Testing Library
- **Linting**: ESLint 10.3.0
- **Development**: Nodemon 3.1.4
- **Process Management**: PM2 (for non-serverless deployments)

## Project Structure & Conventions

### Monorepo Architecture
```
CRM-Dashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level components  
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   ├── constants/      # Shared constants and enums
│   │   └── assets/         # Static assets
│   ├── public/             # Static public files
│   ├── dist/               # Vite build output
│   └── package.json
├── server/                 # Express backend
│   ├── routes/            # API route definitions
│   ├── models/            # Mongoose schema models
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration files
│   ├── __tests__/         # Jest test suites
│   └── package.json
└── package.json           # Root workspace config
```

### File Naming Conventions
- **React Components**: PascalCase (`LeadModal.jsx`, `KanbanBoard.jsx`)
- **React Hooks**: camelCase with 'use' prefix (`useLeads.js`, `useDebounce.js`)
- **API Routes**: kebab-case files, RESTful endpoints (`leads.js` → `/api/leads`)
- **Database Models**: PascalCase singular (`User.js`, `Lead.js`, `Reminder.js`)
- **Utility Functions**: camelCase (`duplicateDetection.js`, `emailService.js`)

### Code Organization Principles
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data layers
- **Component Composition**: Favor small, focused components over large monolithic ones
- **Service Layer**: Abstract API calls behind service interfaces
- **Custom Hooks**: Extract stateful logic into reusable hooks
- **Constants Management**: Centralize enums and configuration in constants files

## Authentication Architecture

### JWT Implementation Details
**Location**: `server/middleware/auth.js`, `server/routes/auth.js`

**Token Structure**:
- **Access Tokens**: 15-minute expiry, contains user ID, sent in Authorization header
- **Refresh Tokens**: 7-day expiry, cryptographically random + JWT signature, httpOnly cookies
- **Token Rotation**: New refresh token issued on every login/refresh operation
- **Server-side Storage**: Hashed refresh tokens stored in User model (`refreshTokenHash`)

**Security Features**:
- **Reuse Detection**: Automatic session revocation on refresh token reuse
- **Secure Cookies**: httpOnly, secure (HTTPS), sameSite protection
- **Password Hashing**: bcrypt with 12 salt rounds
- **Rate Limiting**: 20 auth attempts per 15 minutes per IP

### Role-Based Authorization
**Location**: `server/middleware/authorize.js`

**Role Hierarchy**: sales_rep < manager < admin

**Implementation Pattern**:
```javascript
router.delete('/:id', protect, authorize('admin', 'manager'), handler)
```

**Authorization Flow**:
1. `protect` middleware verifies JWT and attaches `req.user`
2. `authorize` middleware checks user role against allowed roles
3. Route handler executes with authenticated, authorized user context

## Database Schema & Indexing

### MongoDB Connection
**Location**: `server/config/db.js`

**Connection Strategy**:
- **Development**: Direct connection with auto-reconnect
- **Serverless**: Cached connection with lazy initialization
- **Production**: Connection pooling with Atlas cluster

**Indexes (Current)**:
```javascript
// User Model
{ email: 1 } // unique index

// Lead Model  
{ owner: 1, email: 1 } // unique compound index
{ owner: 1, status: 1 } // pipeline queries
{ owner: 1, phone: 1 } // duplicate detection
{ owner: 1, tags: 1 } // tag filtering
{ name: 'text', email: 'text', company: 'text' } // full-text search

// Reminder Model
{ owner: 1, completed: 1, dueDate: 1 } // dashboard queries
{ lead: 1 } // lead association
{ dueDate: 1, emailSent: 1, completed: 1 } // email scheduler
```

## API Architecture & Conventions

### RESTful Endpoint Design
**Base URL Structure**: `/api/{resource}[/{id}][/{sub-resource}]`

**Standard HTTP Methods**:
- `GET /api/leads` - List with pagination, search, filters
- `GET /api/leads/:id` - Retrieve single lead with activities
- `POST /api/leads` - Create new lead (with duplicate detection)
- `PUT /api/leads/:id` - Full update of lead
- `PATCH /api/leads/:id/status` - Partial update (status only)
- `DELETE /api/leads/:id` - Remove lead (admin/manager only)

### Specialized Endpoints
- `GET /api/leads/kanban` - Grouped pipeline data
- `GET /api/leads/analytics` - Aggregated statistics  
- `GET /api/leads/export` - CSV download (manager+ only)
- `POST /api/leads/check-duplicates` - Duplicate detection
- `POST /api/leads/:id/activities` - Activity logging
- `POST /api/webhooks/leads` - External lead capture

### Response Format Standardization
```javascript
{
  success: boolean,
  message: string,
  data: object | array | null,
  // Optional pagination metadata for list endpoints
  pagination?: {
    page: number,
    limit: number, 
    total: number,
    pages: number
  }
}
```

## Configuration Management

### Environment Variables

**Server Configuration** (`server/.env`):
```bash
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/leadflow

# JWT Configuration  
JWT_SECRET=crypto.randomBytes(64).toString('hex')
JWT_REFRESH_SECRET=different_secret_for_refresh_tokens
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Settings
PORT=5000
NODE_ENV=development|production|test
CLIENT_ORIGIN=https://your-frontend-domain.com

# Email Service (Nodemailer SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com  
SMTP_PASS=app-specific-password
SMTP_FROM=LeadFlow <no-reply@leadflow.app>

# Webhooks
WEBHOOK_SECRET=hmac_signature_secret
WEBHOOK_OWNER_ID=mongodb_user_id_for_webhook_leads
```

**Client Configuration** (`client/.env`):
```bash
# API Integration
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

### Configuration Locations
- **Database Connection**: `server/config/db.js`
- **CORS Setup**: `server/server.js` (origin validation)
- **Rate Limiting**: `server/server.js` (endpoint-specific limits)
- **API Base URL**: `client/src/services/api.js`
- **Build Configuration**: `client/vite.config.js`

## Deployment Architecture

### Current Deployment Model
**Platform**: Vercel (both frontend and backend)

**Frontend Deployment**:
- **Framework**: Vite static site generation  
- **Output**: `client/dist/` directory
- **Routing**: SPA with client-side routing via `vercel.json` rewrites
- **CDN**: Vercel Edge Network for global asset delivery

**Backend Deployment**:
- **Model**: Serverless functions via Vercel
- **Entry Point**: `server/server.js` exported as module
- **Configuration**: `server/vercel.json` routes all requests to server.js
- **Database**: MongoDB Atlas with connection caching for serverless

### Build Commands & Scripts
**Root Level** (`package.json`):
```json
{
  "scripts": {
    "server": "cd server && npm run dev",
    "client": "cd client && npm run dev", 
    "dev": "start npm run server & npm run client"
  }
}
```

**Client Scripts** (`client/package.json`):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Server Scripts** (`server/package.json`):
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js", 
    "test": "jest --runInBand --forceExit"
  }
}
```

## Security Implementation Details

### Input Validation & Sanitization
**Location**: `server/middleware/validators.js`

**Validation Stack**: express-validator for request validation

**XSS Prevention**: HTML entity encoding, no dangerouslySetInnerHTML usage

**SQL Injection**: Mongoose ODM prevents NoSQL injection via parameterized queries

### CORS & Security Headers  
**Location**: `server/server.js`

**CORS Policy**:
- Development: Allow localhost + .vercel.app + .netlify.app domains
- Production: Restrict to CLIENT_ORIGIN environment variable
- Credentials: true (for httpOnly cookies)

**Security Headers** (via Helmet):
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: same-origin

### Rate Limiting Strategy
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 20 requests per 15 minutes per IP  
- **Webhooks**: 30 requests per 1 minute per IP
- **Test Environment**: Rate limiting disabled for test execution

## Testing Architecture

### Backend Testing
**Location**: `server/__tests__/`

**Test Database**: Separate `leadflow_test` database
**Setup**: `beforeAll` connection, `afterEach` cleanup, `afterAll` disconnection
**Coverage**: Routes, middleware, utilities, models

### Test Execution Environment
```javascript
// Test environment variables
NODE_ENV=test
JWT_SECRET=test_secret  
JWT_REFRESH_SECRET=test_refresh_secret
MONGO_URI=mongodb://localhost:27017/leadflow_test
```

## Performance Considerations

### Database Performance
- **Indexing**: Strategic indexes for common query patterns
- **Aggregation**: Optimized pipelines with early $match filtering  
- **Pagination**: Server-side pagination to prevent large data transfers
- **Connection Pooling**: MongoDB Atlas handles connection management

### Frontend Performance
- **Code Splitting**: Route-level lazy loading implemented
- **Bundle Size**: React 19, limited external dependencies
- **Caching**: Browser caching via Vercel CDN
- **Optimization**: Vite build optimizations for production

## Critical Constraints

### Protected Implementation Areas
- **Restriction**: Do not modify anything under `<<OTHER_SITE_PATH_OR_ROUTE>>`
- **Rationale**: Designated areas ship as-is per project requirements
- **Impact**: Shared dependencies requiring changes must be flagged in design.md

### Framework Stability
- **MERN Stack Preservation**: No framework migrations (React→Next.js, Express→Fastify)
- **Version Upgrades**: Patch/minor updates acceptable, major version changes require justification
- **Library Additions**: Prefer existing stack capabilities over new dependencies

This technical foundation provides the architectural constraints and patterns for all development work on the LeadFlow CRM system.