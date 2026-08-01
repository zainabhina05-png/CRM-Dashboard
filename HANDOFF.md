# LeadFlow CRM — Project Handoff

## Live URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://client-cyan-rho.vercel.app | ✅ Live |
| Backend API | https://crm-dashboard-seven-mu.vercel.app | ✅ Live |
| Health check | `GET /api/health` → `{"success":true,"message":"Server is running"}` | ✅ Verified |

---

## Demo Credentials

See [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) for full instructions.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@leadflow-demo.com` | `demo123!` |
| Manager | `manager@leadflow-demo.com` | `demo123!` |
| Sales Rep | `sales@leadflow-demo.com` | `demo123!` |

Generate demo data: `npm run seed`

---

## What Was Built / Changed

### Security (Tasks 1.3 + 1.4)
| Feature | Detail |
|---------|--------|
| Progressive delay brute-force protection | 1s → 30s delay after repeated failed logins |
| Session tracking | Per-user session store with IP + UA, `GET /api/auth/sessions` |
| Token reuse detection | Automatic session revocation on refresh token reuse |
| Security event logging | 13 event types logged via Winston |
| Kanban IDOR protection | Server re-verifies ownership on every drag (404 on foreign leads) |
| Role-based stage locks | sales_rep blocked from Won/Lost; admin unlocks terminal stages |
| Optimistic concurrency | `__v` version check returns 409 on stale updates |
| XSS sanitisation | All HTML/JS stripped from card content, notes, tags before storage |
| Audit trail | Every pipeline move logged with who/from/to/when |
| Rate limiting | 30 status changes/min/user on Kanban endpoint |

### Design System (Task 1.5)
- `src/styles/tokens.css` — 10-step colour scale, spacing, type, radius, shadow, z-index, motion tokens
- `src/styles/motion.js` — 9 Framer Motion variant presets (page, modal, kanban, list, stats, toast…)
- `src/styles/responsive.css` — Mobile-first responsive system (320→1280px+)
- All pages wrapped with `pageVariants` transitions; Kanban board stagger; modal `AnimatePresence`
- `MotionConfig(reducedMotion="user")` respects user preference

### Testing (Tasks 2.1 + 2.2)
| Suite | Tests | Coverage |
|-------|-------|----------|
| Backend (Jest + Supertest) | **133 passing** | **77.89% lines** |
| Frontend (Vitest + RTL + MSW) | **78 passing** | 20.5% components |
| New test files | 13 files | reminders, webhooks, errorHandler, pipeline security, auth security, utils |

### CI/CD (Task 2.4)
5-stage GitHub Actions pipeline: `lint → test-backend → test-frontend → build → deploy`
- Coverage thresholds enforced (breaks build if dropped)
- `mongodb-memory-server` — no external DB in CI
- Vercel auto-deploy on `main` push

### Performance (Tasks 4.1 + 4.2)
- 5 new compound MongoDB indexes: ownership checks, source/status filtering, kanban sort
- `React.memo` on AnalyticsCard, KanbanCard, StatusBadge
- Animated progress bar fill on AnalyticsCard
- Accessibility: progressbar role, aria-valuenow on stat cards

### UI/UX (Tasks 3.2 + 3.3)
- Full responsive layout: hamburger nav on mobile, stacked forms, Kanban scroll-snap
- `EmptyState` component: empty/error/loading variants with retry and CTA
- Dashboard: empty state with "Add first lead" when total=0, error state with retry
- Analytics numbers formatted with `toLocaleString()`

---

## Environment Variables Required

### Backend (Vercel project settings)
```
MONGO_URI                — MongoDB Atlas connection string
JWT_SECRET               — 64-char random (npm run generate-secrets)
JWT_REFRESH_SECRET       — different 64-char random
NODE_ENV=production
CLIENT_ORIGIN            — exact frontend URL (no trailing slash)
```

### Frontend (Vercel project settings)
```
VITE_API_BASE_URL        — https://your-backend.vercel.app/api
```

Optional: `SMTP_*` for email reminders, `WEBHOOK_SECRET` + `WEBHOOK_OWNER_ID` for webhook intake.

---

## Running Locally

```bash
git clone https://github.com/zainabhina05-png/CRM-Dashboard.git
cd CRM-Dashboard

# Backend
cd server
cp .env.example .env          # fill in MONGO_URI + JWT secrets
npm install
npm run dev                   # Express on :5000

# Frontend (new terminal)
cd client
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev                   # Vite on :5173

# Demo data
cd ..
npm run seed                  # populates ~85 leads, 35 reminders, 3 users
cat DEMO_CREDENTIALS.md       # login details
```

---

## Running Tests

```bash
# Backend — 133 tests, no external DB needed
cd server && npm test

# Frontend — 78 tests
cd client && npm test

# With coverage reports
cd server && npm test -- --coverage
cd client && npm run test:coverage

# Run a single test file
cd server && npx jest __tests__/pipelineSecurity.test.js
```

---

## Deployment

Vercel deploys automatically when `main` is updated via GitHub Actions.

Manual deploy from CLI:
```bash
# Generate secrets first
npm run generate-secrets

# Deploy backend (set root directory to server/ in Vercel UI)
cd server && vercel --prod

# Deploy frontend (set root directory to client/ in Vercel UI)
cd client && vercel --prod
```

Full step-by-step: see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Security Checklist (Verified)

- ✅ OWASP A01 Broken Access Control — server-side ownership on all routes
- ✅ OWASP A02 Cryptographic Failures — bcrypt 12 rounds, httpOnly cookies, JWT expiry
- ✅ OWASP A03 Injection — Mongoose ODM, input validation, XSS sanitisation
- ✅ OWASP A05 Misconfiguration — Helmet headers, CORS restricted to CLIENT_ORIGIN
- ✅ OWASP A07 Auth Failures — progressive delay, token rotation, reuse detection
- ✅ No secrets committed — all .env files in .gitignore
- ✅ Rate limiting — 20 auth attempts/15min, 30 pipeline moves/min/user

---

## Feature Parity (Phase 0 → Final)

| Feature | Before | After |
|---------|--------|-------|
| Auth & JWT | Basic | Progressive delay, session tracking, reuse detection |
| Kanban security | Client-only | G1–G8 server-side enforcement |
| Tests | 43 | **211 (133 backend + 78 frontend)** |
| Backend coverage | ~40% est. | **77.89%** |
| Design system | Ad-hoc CSS vars | Formal token system + responsive CSS |
| Animations | None | Framer Motion (pages, modals, kanban, stats) |
| Mobile layout | Basic | Full responsive with hamburger nav |
| Empty/error states | Partial | Complete (all screens) |
| CI/CD | None | 5-stage GitHub Actions |
| Seed system | None | Production-safe idempotent seed |
| MongoDB indexes | 5 | **10** (+ compound performance indexes) |

---

*Handoff completed. All 15/15 Phase 0 features verified present and working.*
