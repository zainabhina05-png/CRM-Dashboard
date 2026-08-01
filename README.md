<div align="center">

# LeadFlow CRM

**Full-stack MERN Customer Relationship Management platform**  
Drag-and-drop pipeline · Real-time analytics · Enterprise-grade security

[![Live Demo](https://img.shields.io/badge/Live_Demo-client--cyan--rho.vercel.app-000?style=for-the-badge&logo=vercel)](https://client-cyan-rho.vercel.app)
[![API](https://img.shields.io/badge/Backend_API-crm--dashboard--seven--mu.vercel.app-000?style=for-the-badge&logo=vercel)](https://crm-dashboard-seven-mu.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-211_passing-22c55e?style=for-the-badge&logo=jest)](server/__tests__)
[![Coverage](https://img.shields.io/badge/Backend_Coverage-77.89%25-22c55e?style=for-the-badge)](server/coverage)
[![CI](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088ff?style=for-the-badge&logo=github-actions)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-6366f1?style=for-the-badge)](LICENSE)

</div>

---

## What is LeadFlow?

LeadFlow is a production-ready CRM built on the MERN stack (MongoDB · Express · React · Node.js). It gives sales teams a complete pipeline for managing leads from first contact to closed deal, with a Kanban board, rich analytics, reminder scheduling, and role-based access control baked in from day one.

The UI follows a **Solar Ocean glassmorphism** design language — deep navy, sunflower gold, and ocean teal — built with Framer Motion for purposeful page and element transitions, and a mobile-first responsive layout that works from 320 px to 4 K.

---

## Live Demo

| | |
|---|---|
| **App** | https://client-cyan-rho.vercel.app |
| **API health** | https://crm-dashboard-seven-mu.vercel.app/api/health |

### Demo accounts (pre-seeded)

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | `admin@leadflow-demo.com` | `demo123!` | Full system — users, all leads, delete, unlock pipeline |
| Manager | `manager@leadflow-demo.com` | `demo123!` | Team view, CSV export, close deals Won/Lost |
| Sales Rep | `sales@leadflow-demo.com` | `demo123!` | Own leads, full pipeline except closing |

---

## Features

### Lead Management
- **Full CRUD** — create, edit, delete leads with duplicate detection before save
- **Custom fields** — up to 10 key/value pairs per lead
- **Tags** — up to 20 tags, filterable
- **Activity timeline** — every note, call, email, meeting, and status change logged
- **Lead sources** — website, referral, social media, paid ads, cold call, other
- **Search + filter** — full-text search, status, source, and tag filters simultaneously

### Kanban Pipeline
- **Drag-and-drop** board powered by `@dnd-kit` with smooth `framer-motion` animations
- **6 pipeline stages** — New → Contacted → Qualified → Proposal → Won / Lost
- **Server-side security on every move** — ownership verified, IDOR protection, role-based stage locks, optimistic concurrency (`__v`), XSS sanitisation, audit trail

### Analytics Dashboard
- Per-status KPI cards with animated progress bars
- Pipeline funnel, lead-source donut, win/loss donut
- 12-month trend line chart (Recharts)
- All charts load with staggered Framer Motion entrance animations

### Authentication & Security
- **JWT access tokens** (15 min) + **httpOnly refresh tokens** (7 days)
- **Automatic token rotation** on every refresh; **reuse detection** revokes all sessions
- **Progressive delay** brute-force protection (1 s → 5 s → 15 s → 30 s)
- **Session tracking** — per-user session store with IP + user-agent; `GET /api/auth/sessions`
- **RBAC** — three roles (admin / manager / sales_rep) enforced server-side on every route
- **Helmet** security headers, strict CORS, rate limiting on all sensitive endpoints

### Reminders & Notifications
- Per-lead follow-up tasks with due dates
- Notification bell in navbar with overdue / due-today counts
- Email alerts via Nodemailer SMTP (optional — degrades gracefully to console)

### CSV Export & Webhooks
- Filtered CSV export (manager + admin only)
- Inbound webhook `POST /api/webhooks/leads` — Facebook Lead Ads / Zapier compatible, HMAC-SHA256 verified

### Responsive UI
- Mobile-first — hamburger nav, stacked forms, scroll-snap Kanban on small screens
- Tablet and desktop layouts progressively enhanced
- `prefers-reduced-motion` respected via `MotionConfig`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 · Vite 8 · React Router 7 · Framer Motion 11 |
| **State** | React Context + custom hooks (no Redux) |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Charts** | Recharts 3 |
| **HTTP Client** | Axios with silent JWT refresh interceptor |
| **Backend** | Node.js · Express 4 |
| **Database** | MongoDB · Mongoose 8 |
| **Auth** | jsonwebtoken · bcryptjs · cookie-parser |
| **Security** | Helmet · express-rate-limit · express-validator |
| **Email** | Nodemailer |
| **Logging** | Winston (structured JSON in prod) · Morgan |
| **Tests** | Jest 29 · Supertest · mongodb-memory-server · Vitest · React Testing Library · MSW |
| **CI/CD** | GitHub Actions (5-stage pipeline) |
| **Hosting** | Vercel (frontend + backend serverless) · MongoDB Atlas |

---

## Project Structure

```
CRM-Dashboard/
├── client/                        React + Vite frontend
│   ├── src/
│   │   ├── components/            Navbar, KanbanBoard, LeadTable, …
│   │   ├── pages/                 Dashboard, Leads, Pipeline, Analytics, Login, Register
│   │   ├── context/               AuthContext, ToastContext
│   │   ├── hooks/                 useLeads, useReminders, useRole, useDebounce
│   │   ├── services/              api.js (axios + refresh interceptor), leadService, …
│   │   ├── styles/                tokens.css, responsive.css, motion.js
│   │   └── __tests__/             78 tests (Vitest + RTL + MSW)
│   └── vite.config.js
│
├── server/                        Express + MongoDB backend
│   ├── routes/                    auth, leads, reminders, webhooks
│   ├── models/                    User, Lead, Reminder
│   ├── middleware/                auth, authorize, pipelineSecurity, authSecurity, validators
│   ├── config/                    db.js (connection pooling + serverless caching)
│   ├── utils/                     logger, emailService, reminderScheduler, duplicateDetection
│   └── __tests__/                 133 tests across 9 suites (Jest + Supertest)
│
├── scripts/                       generate-secrets.js, seed.js
├── .github/workflows/             ci.yml (lint → test → build → deploy)
└── README.md
```

---

## Running Tests

```bash
# Backend — 133 tests, zero external dependencies (mongodb-memory-server)
cd server
npm test                      # run all
npm test -- --coverage        # with coverage report (threshold: 75% lines enforced)

# Frontend — 78 tests (Vitest + React Testing Library + MSW)
cd client
npm test                      # run all
npm run test:coverage         # with coverage report
```

Test suites cover:
- Auth: register, login, refresh, logout, token reuse detection, sessions
- Leads: full CRUD, pagination, filtering, export, analytics, kanban
- Reminders: all 5 endpoints + validation + ownership
- Webhooks: unsigned dev mode, HMAC signed, duplicate detection, field normalisation
- Pipeline security: G1–G8 (IDOR, stage locks, role restrictions, concurrency, sanitisation)
- Auth security: progressive delay, session tracking, security event logging
- Error handler: all 7 error type branches
- Frontend: ProtectedRoute, LoginPage, RegisterPage, Navbar, TagInput, Pagination, StatusBadge, hooks, context

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas URI (or local `mongod`)

### Setup

```bash
# 1. Clone
git clone https://github.com/zainabhina05-png/CRM-Dashboard.git
cd CRM-Dashboard

# 2. Backend
cd server
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET
npm install
npm run dev          # Express on :5000

# 3. Frontend (new terminal)
cd client
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev          # Vite on :5173

# 4. Seed demo data
cd ..
npm run seed         # Creates 3 users + 85 leads + 35 reminders
```

Demo credentials are printed to the terminal when the seed finishes.

---

## Deployment (Vercel)

### Generate secrets first
```bash
npm run generate-secrets
# Prints JWT_SECRET, JWT_REFRESH_SECRET, WEBHOOK_SECRET to use below
```

### Backend
1. Import `server/` as a Vercel project, Framework Preset → **Other**, root directory → `server`
2. Set environment variables in Vercel Settings:

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 64-char random (from generate-secrets) |
| `JWT_REFRESH_SECRET` | Different 64-char random |
| `NODE_ENV` | `production` |
| `CLIENT_ORIGIN` | Exact frontend URL (set after step 3) |

### Frontend
1. Import `client/` as a separate Vercel project, Framework Preset → **Vite**, root directory → `client`
2. Set `VITE_API_BASE_URL=https://your-backend.vercel.app/api`

Full walkthrough: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, returns access token + sets refresh cookie |
| `POST` | `/api/auth/refresh` | cookie | Silent token refresh |
| `POST` | `/api/auth/logout` | JWT | Revoke session |
| `GET` | `/api/auth/me` | JWT | Current user profile |
| `GET` | `/api/auth/sessions` | JWT | List active sessions |
| `DELETE` | `/api/auth/sessions` | JWT | Revoke all sessions |
| `GET` | `/api/leads` | JWT | Paginated lead list (search, filter, sort) |
| `POST` | `/api/leads` | JWT | Create lead (duplicate check) |
| `GET` | `/api/leads/kanban` | JWT | Leads grouped by pipeline stage |
| `GET` | `/api/leads/analytics` | JWT | Status counts, source breakdown, trend |
| `GET` | `/api/leads/export` | JWT manager+ | CSV download |
| `GET` | `/api/leads/:id` | JWT | Single lead with activities |
| `PUT` | `/api/leads/:id` | JWT | Full lead update |
| `PATCH` | `/api/leads/:id/status` | JWT | Stage change (ownership + role verified) |
| `POST` | `/api/leads/:id/activities` | JWT | Log note / call / email / meeting |
| `DELETE` | `/api/leads/:id` | JWT manager+ | Delete lead |
| `GET` | `/api/reminders` | JWT | List reminders (pending/completed, leadId filter) |
| `GET` | `/api/reminders/summary` | JWT | Overdue + due-today counts |
| `POST` | `/api/reminders` | JWT | Create reminder |
| `PATCH` | `/api/reminders/:id/complete` | JWT | Mark complete |
| `DELETE` | `/api/reminders/:id` | JWT | Delete reminder |
| `POST` | `/api/webhooks/leads` | HMAC | Inbound lead capture |
| `GET` | `/api/health` | — | Health check |

---

## Security

| Measure | Detail |
|---------|--------|
| Password hashing | bcrypt, 12 salt rounds |
| Access tokens | JWT, 15-minute expiry, Authorization header |
| Refresh tokens | Opaque + signed, 7-day expiry, httpOnly cookie |
| Token rotation | New refresh token issued on every use |
| Reuse detection | Replay → all user sessions revoked |
| Brute-force protection | Progressive delays: 1 s → 30 s; 20 attempts/15 min hard cap |
| RBAC | Three roles enforced server-side on every route |
| IDOR protection | Every lead operation re-verifies ownership (404 on foreign IDs) |
| Stage lock | Won/Lost requires manager+; terminal stages need admin to re-open |
| Concurrency | `__v` version check → 409 on stale updates |
| XSS | All user text stripped of HTML/JS before storage |
| Audit trail | Every pipeline move logged with user/timestamp |
| Rate limits | 100 req/15 min global; 30 auth; 30 pipeline moves/min/user |
| Security headers | Helmet (CSP, HSTS, X-Frame-Options, …) |
| CORS | Restricted to `CLIENT_ORIGIN` in production |

---

## CI/CD

GitHub Actions runs on every push:

```
lint → test-backend (coverage ≥75%) → test-frontend → build → deploy (main only)
```

All quality gates must pass before the deploy job runs. Coverage thresholds are enforced in the Jest / Vitest config — the build fails if they drop.

---

## Environment Variables

### Server (`server/.env`)

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/leadflow
JWT_SECRET=<64-char random>
JWT_REFRESH_SECRET=<different 64-char random>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
SMTP_HOST=smtp.gmail.com        # optional
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=app-password
SMTP_FROM=LeadFlow <no-reply@leadflow.app>
WEBHOOK_SECRET=<32-char random> # optional
WEBHOOK_OWNER_ID=               # MongoDB _id of webhook lead owner
```

### Client (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

<div align="center">

Built with care · MIT License

</div>
