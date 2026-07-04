<div align="center">

<h1>LeadFlow CRM</h1>

**A full-stack MERN CRM for modern lead pipeline management**  
Built by **@zainabhina05-png** &nbsp;·&nbsp; Deployed on **Vercel** (frontend) &amp; **Render** (backend)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://leadflow-crm.vercel.app)
[![API](https://img.shields.io/badge/Backend_API-Render-46E3B7?style=for-the-badge&logo=render)](https://leadflow-api.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-6366f1?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-43_Passing-22c55e?style=for-the-badge&logo=jest)](server/__tests__)

</div>

---

## What is LeadFlow?

LeadFlow is a production-ready **Customer Relationship Management (CRM)** platform I designed and built from scratch. It features a stunning **Solar Ocean glassmorphism UI**, a drag-and-drop Kanban pipeline, real-time analytics, automated reminders, and enterprise-grade security — all in a monorepo you can deploy in under 15 minutes.

> **Built entirely by me** — from architecture decisions to UI polish — as a showcase of full-stack engineering with React, Node.js, MongoDB, and modern DevOps.

---

## Feature Highlights

| Area | Details |
|---|---|
| **Auth & Security** | JWT access tokens (15 min) + httpOnly refresh tokens (7 days), rotation & reuse detection, RBAC (Admin / Manager / Sales Rep), rate-limited auth routes |
| **Lead Management** | Full CRUD, tags, custom fields, activity timeline, duplicate detection & merge, lead source tracking |
| **Kanban Pipeline** | Drag-and-drop board powered by `@dnd-kit` with live stage transitions |
| **Analytics Dashboard** | Per-status KPIs, pipeline funnel, source donut, win/loss donut, 12-month trend line (Recharts) |
| **CSV Export** | Filtered lead exports for Admin & Manager roles |
| **Reminders** | Per-lead follow-up tasks with due dates, in-app notification bell, email alerts via Nodemailer |
| **Webhooks** | Inbound `POST /api/webhooks/leads` for Facebook Lead Ads / Zapier with HMAC-SHA256 verification |
| **Logging** | Structured Winston logs (colourised dev, JSON files in prod), HTTP via Morgan |
| **Tests** | 43 Jest + Supertest tests covering auth, leads CRUD, RBAC, and utilities |

---

## Tech Stack

```
Frontend   React 19 · Vite 6 · React Router 7 · Axios · @dnd-kit · Recharts · Vanilla CSS
Backend    Node.js · Express 4 · MongoDB (Mongoose 8) · JWT · bcryptjs · Nodemailer
Security   Helmet · CORS · express-rate-limit · cookie-parser · express-validator · HMAC
Testing    Jest 29 · Supertest · Nodemon · Winston · Morgan
```

---

## Project Structure

```
project/
├── client/                    React + Vite frontend (deploy on Vercel)
│   ├── src/
│   │   ├── components/        Shared UI components (Kanban, LeadTable, etc.)
│   │   ├── context/           AuthContext, ToastContext
│   │   ├── hooks/             useLeads, useReminders, useRole, useDebounce
│   │   ├── pages/             Dashboard, Leads, Pipeline, Analytics
│   │   └── services/          api.js (axios), leadService, authService
│   ├── .env.example           ← copy to .env and fill in
│   └── vite.config.js
│
├── server/                    Express + MongoDB backend (deploy on Render)
│   ├── __tests__/             43 Jest + Supertest tests
│   ├── config/                db.js
│   ├── middleware/            auth, authorize, errorHandler, validators
│   ├── models/                User, Lead, Reminder
│   ├── routes/                auth, leads, reminders, webhooks
│   ├── utils/                 logger, emailService, reminderScheduler, duplicateDetection
│   ├── .env.example           ← copy to .env — never commit .env
│   └── server.js
│
├── vercel.json                Fullstack Vercel config (serverless option)
└── netlify.toml               Netlify frontend config (alternative)
```

---

## Deployment Guide

> **Recommended:** Split deployment — Vercel (frontend) + Render (backend) + MongoDB Atlas (database)

### Step 1 — MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → create a **free M0 cluster**
2. **Database Access** → create a user with username + password
3. **Network Access** → Add `0.0.0.0/0` (allow all IPs, or add Render's static IPs later)
4. Click **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/leadflow?retryWrites=true&w=majority
   ```
5. Save this — you'll paste it as `MONGO_URI` in Render.

---

### Step 2 — Deploy Backend on Vercel (Serverless)

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import your GitHub repo
2. Configure:

   | Setting | Value |
   |---|---|
   | **Framework** | `Other` |
   | **Root directory** | `server` |
   | **Build command** | (leave empty) |
   | **Output directory** | (leave empty) |

3. Add environment variables:

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | `mongodb+srv://...` (from Step 1) |
   | `JWT_SECRET` | A long random string — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
   | `JWT_REFRESH_SECRET` | A **different** long random string |
   | `NODE_ENV` | `production` |
   | `CLIENT_ORIGIN` | Your frontend Vercel URL — set after Step 3 |
   | `PORT` | `5000` |

4. Click **Deploy** → note your URL e.g. `https://leadflow-api.vercel.app`

> **Note:** The backend uses Vercel's serverless functions. The automated reminder scheduler (background email sending) won't run continuously since serverless functions spin down when idle. This is expected for a portfolio project — the core API, login, registration, and lead management work perfectly 24/7.

---

### Step 3 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import `CRM-Dashboard`
2. Configure:

   | Setting | Value |
   |---|---|
   | **Framework** | `Vite` |
   | **Root directory** | `client` |
   | **Build command** | `npm run build` |
   | **Output directory** | `dist` |

3. Add environment variable:

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://leadflow-api.vercel.app/api` |

4. Deploy → get URL like `https://leadflow-crm.vercel.app`

---

### Step 4 — Wire CORS (Back on Vercel)

In your Vercel backend project → **Settings → Environment Variables** → update:

```
CLIENT_ORIGIN=https://leadflow-crm.vercel.app
```

Redeploy. Your frontend now talks to the API.

---

### Step 5 — Verify

- Open your Vercel URL → register a user → log in → create a lead
- Check Vercel dashboard logs for errors
- Check MongoDB Atlas → **Collections** → data should appear

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI

### Setup

```bash
# 1. Clone
git clone https://github.com/zainabhina05-png/CRM-Dashboard.git
cd CRM-Dashboard

# 2. Server
cd server
npm install
cp .env.example .env
# Edit server/.env — fill in MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET

# 3. Client
cd ../client
npm install
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:5000/api is fine for local dev

# 4. Start (two terminals)
cd server && npm run dev      # Express on :5000
cd client && npm run dev      # Vite on :5173
```

Open **http://localhost:5173** — Vite proxies `/api/*` to `localhost:5000`.

---

## Security & Privacy

> This repo follows best practices for secret management.

- `.env` files are gitignored and **never committed** to this repo
- Only `.env.example` template files (with safe placeholder values) are tracked
- `node_modules/` and `dist/` build artifacts are excluded
- JWT secrets are always loaded from environment variables — never hardcoded
- Test files use throwaway `test_secret` values only
- **When deploying:** generate fresh production secrets — never reuse dev values

---

## Running Tests

```bash
cd server
npm test              # run all 43 tests
npm run test:watch    # watch mode
```

Tests use a dedicated `leadflow_test` database and clean up after each run.

---

## Environment Variables Reference

### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for access tokens — use a long random string |
| `JWT_EXPIRES_IN` | | Token TTL (default: `15m`) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret — must differ from `JWT_SECRET` |
| `JWT_REFRESH_EXPIRES_IN` | | Refresh TTL (default: `7d`) |
| `PORT` | | Server port (default: `5000`) |
| `NODE_ENV` | | `development` / `production` / `test` |
| `CLIENT_ORIGIN` | | Frontend URL for CORS (e.g. `https://your-app.vercel.app`) |
| `SMTP_HOST` | | SMTP hostname (leave blank = console stub in dev) |
| `SMTP_PORT` | | SMTP port (default: `587`) |
| `SMTP_SECURE` | | `true` for port 465, `false` otherwise |
| `SMTP_USER` | | SMTP username / email |
| `SMTP_PASS` | | SMTP password / app password |
| `SMTP_FROM` | | From address in emails |
| `WEBHOOK_SECRET` | | HMAC secret for inbound webhooks |
| `WEBHOOK_OWNER_ID` | | MongoDB `_id` of user who owns webhook leads |

### `client/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Full backend URL e.g. `https://leadflow-api.onrender.com/api` |

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

**Generate HMAC signature:**
```js
const crypto = require('crypto');
const body = JSON.stringify(payload);
const sig = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
```

> Signature check is skipped in development for easy local testing.

---

## Alternative Deployment Options

<details>
<summary><b>Option B — Fullstack on Vercel (Serverless)</b></summary>

The `vercel.json` at the repo root wraps Express as a serverless function.

> **Limitation:** The reminder scheduler (`setInterval`) will not persist between cold starts. Use a Vercel Cron Job or an external cron service (EasyCron, Cronhooks) to trigger reminders instead.

1. Import repo on Vercel (select **root** as project root)
2. Add all server environment variables in Vercel Project Settings → Environment Variables
3. Deploy — Vercel auto-detects `vercel.json`

</details>

<details>
<summary><b>Option C — Frontend on Netlify + Backend on Render</b></summary>

The `netlify.toml` is pre-configured for the client build.

1. Deploy backend to Render (same as Step 2)
2. Import `client` folder on Netlify
3. In `netlify.toml`, replace the redirect target:
   ```toml
   to = "https://your-render-service.onrender.com/api/:splat"
   ```
4. Add `VITE_API_BASE_URL` in Netlify Site Settings → Environment Variables

</details>

---

<div align="center">

**Built with care by [@zainabhina05-png](https://github.com/zainabhina05-png)**

*If this project helped you, a star on GitHub means a lot!*

</div>
