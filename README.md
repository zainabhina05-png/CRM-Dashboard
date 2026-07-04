# LeadFlow CRM

A full-stack MERN CRM for lead pipeline management — built with a "Solar Ocean" corporate glassmorphism UI.

## Feature Overview

| Area | What's included |
|---|---|
| **Auth** | JWT access tokens (15 min) + httpOnly refresh tokens (7 days), rotation & reuse detection, RBAC (Admin / Manager / Sales Rep), rate-limited auth routes |
| **Leads** | Full CRUD, Kanban drag-and-drop pipeline, tags, custom fields, activity timeline, duplicate detection & merge, lead source tracking |
| **Analytics** | Dashboard with per-status KPIs, pipeline funnel bar chart, source donut, win/loss donut, 12-month trend line (Recharts) |
| **Export** | CSV export of filtered lead lists (admin + manager only) |
| **Reminders** | Per-lead follow-up tasks with due dates, in-app notification bell, email alerts via Nodemailer |
| **Webhooks** | Inbound `POST /api/webhooks/leads` for Facebook Lead Ads / Zapier capture with HMAC-SHA256 signature verification |
| **Logging** | Structured Winston logs (colourised dev console, JSON files in production), HTTP request log via Morgan |
| **Tests** | 43 Jest + Supertest tests covering auth, leads CRUD, RBAC, and utility functions |

---

## Tech Stack

**Frontend:** React 19, Vite 8, React Router 7, Axios, @dnd-kit, Recharts, pure CSS (no Tailwind/MUI)  
**Backend:** Node.js, Express 4, MongoDB (Mongoose 8), JWT, bcryptjs, Nodemailer  
**Security:** Helmet, CORS, express-rate-limit, cookie-parser, express-validator, HMAC webhooks  
**Dev:** Jest 29, Supertest, Nodemon, Winston, Morgan

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Setup

```bash
# 1. Clone and install all deps
git clone <your-repo-url>
cd project

npm install                  # root (if concurrently script exists)
cd server && npm install
cd ../client && npm install

# 2. Configure environment variables
cp server/.env.example server/.env
# Edit server/.env — set MONGO_URI, JWT secrets (see below)

cp client/.env.example client/.env
# Default: VITE_API_BASE_URL=http://localhost:5000/api — no change needed locally

# 3. Start both servers
# Terminal 1:
cd server && npm run dev      # Express on :5000

# Terminal 2:
cd client && npm run dev      # Vite on :5173
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` to `localhost:5000`.

### Running Tests

```bash
cd server
npm test             # run all 43 tests once
npm run test:watch   # watch mode
```

Tests use a dedicated `leadflow_test` database and clean up after each run.

---

## Environment Variables

### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for signing access tokens |
| `JWT_EXPIRES_IN` | | Access token TTL (default: `15m`) |
| `JWT_REFRESH_SECRET` | ✅ | Secret for refresh tokens (use a different value) |
| `JWT_REFRESH_EXPIRES_IN` | | Refresh token TTL (default: `7d`) |
| `PORT` | | Server port (default: `5000`) |
| `NODE_ENV` | | `development` \| `production` \| `test` |
| `CLIENT_ORIGIN` | | Production frontend URL for CORS |
| `SMTP_HOST` | | SMTP server hostname (leave blank to use console stub in dev) |
| `SMTP_PORT` | | SMTP port (default: `587`) |
| `SMTP_SECURE` | | `true` for port 465, `false` otherwise |
| `SMTP_USER` | | SMTP username / email |
| `SMTP_PASS` | | SMTP password / app password |
| `SMTP_FROM` | | From address shown in emails |
| `WEBHOOK_SECRET` | | HMAC secret for verifying inbound webhooks |
| `WEBHOOK_OWNER_ID` | | MongoDB `_id` of the user who owns webhook-captured leads |

### `client/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Full URL to the backend API (e.g. `https://api.example.com/api`) |

---

## Deployment

### Option A — Split Deployment (Recommended)

**Frontend → Vercel** · **Backend → Render (or Railway)**

This is the most reliable setup. The Express backend runs as a persistent Node.js server (not serverless), which supports the reminder scheduler, websockets-ready, and keeps MongoDB connections warm.

#### Step 1 — Deploy backend to Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Add all environment variables from the table above under **Environment**
5. Set `NODE_ENV=production`
6. Note the service URL (e.g. `https://leadflow-api.onrender.com`)

#### Step 2 — Deploy frontend to Vercel

1. Import your repository on [vercel.com](https://vercel.com)
2. Configure:
   - **Framework preset:** Vite
   - **Root directory:** `client`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Add environment variable:
   - `VITE_API_BASE_URL` = `https://leadflow-api.onrender.com/api`
4. Deploy

#### Step 3 — Wire CORS

In Render, set:
```
CLIENT_ORIGIN=https://your-app.vercel.app
```

#### Step 4 — MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Under **Network Access**, add `0.0.0.0/0` (allow all) or add Render's static outbound IPs
3. Copy the connection string (SRV format) into `MONGO_URI`

---

### Option B — Fullstack on Vercel (Serverless)

The `vercel.json` at the repo root wraps the Express app as a serverless function.

> ⚠️ **Limitation:** The reminder scheduler (`setInterval`) will not persist between cold starts. Use a Vercel Cron Job or an external cron service (EasyCron, Cronhooks) to call `GET /api/reminders/summary` or a dedicated scheduler endpoint instead.

1. Import repo on Vercel (select root as project root)
2. Add **all** server environment variables in Vercel Project Settings → Environment Variables
3. Deploy — Vercel auto-detects `vercel.json`

---

### Option C — Frontend on Netlify + Backend on Render

The `netlify.toml` is pre-configured for the client build.

1. Deploy backend to Render (same as Option A, Step 1)
2. Import `client` folder on Netlify
3. In `netlify.toml`, replace the redirect target:
   ```toml
   to = "https://your-render-service.onrender.com/api/:splat"
   ```
4. Add `VITE_API_BASE_URL` in Netlify Site Settings → Environment Variables

---

## Logging

In development, Winston prints colourised output to the console.  
In production (`NODE_ENV=production`), logs are written to:
- `server/logs/error.log` — errors only (5 MB max, 5 files)
- `server/logs/combined.log` — all levels (10 MB max, 10 files)

The `logs/` directory is gitignored. Add it to `.gitignore` if not already present.

---

## Webhook Integration

External tools (Zapier, Facebook Lead Ads, custom forms) can POST leads directly:

```
POST /api/webhooks/leads
Content-Type: application/json
X-LeadFlow-Signature: sha256=<HMAC-SHA256 of body using WEBHOOK_SECRET>

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 555 000 0000",
  "company": "Acme Corp",
  "source": "website",
  "tags": ["inbound"],
  "notes": "Came from landing page"
}
```

**HMAC signature (Node.js example):**
```js
const crypto = require('crypto');
const body = JSON.stringify(payload);
const sig = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
```

The signature check is **skipped in development** (`NODE_ENV !== 'production'`) for easy testing.

---

## Project Structure

```
project/
├── client/                  React + Vite frontend
│   ├── src/
│   │   ├── components/      Shared UI components
│   │   ├── context/         AuthContext, ToastContext
│   │   ├── hooks/           useLeads, useReminders, useRole, useDebounce
│   │   ├── pages/           Dashboard, Leads, Pipeline, Analytics
│   │   └── services/        api.js (axios), leadService, authService, reminderService
│   └── vite.config.js
│
├── server/                  Express + MongoDB backend
│   ├── __tests__/           Jest + Supertest tests (43 tests)
│   ├── config/              db.js
│   ├── middleware/          auth, authorize, errorHandler, validators
│   ├── models/              User, Lead, Reminder
│   ├── routes/              auth, leads, reminders, webhooks
│   ├── utils/               logger, emailService, reminderScheduler, duplicateDetection
│   └── server.js
│
├── vercel.json              Fullstack Vercel config (Option B)
└── netlify.toml             Netlify frontend config (Option C)
```
