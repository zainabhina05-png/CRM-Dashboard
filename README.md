<div align="center">

<h1>
  <img src="https://img.shields.io/badge/LeadFlow-CRM-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyek0xMiA1YzEuNjYgMCAzIDEuMzQgMyAzcy0xLjM0IDMtMyAzLTMtMS4zNC0zLTMgMS4zNC0zIDMtM3ptMCAxNC4yYy0yLjUgMC00LjcxLTEuMjgtNi0zLjIyLjAzLTEuOTkgNC0zLjA4IDYtMy4wOCAxLjk5IDAgNS45NyAxLjA5IDYgMy4wOC0xLjI5IDEuOTQtMy41IDMuMjItNiAzLjIyeiIvPjwvc3ZnPg==&logoColor=white" alt="LeadFlow CRM" />
</h1>

**A full-stack MERN CRM for modern lead pipeline management**  
Built by **@zainabhina05-png** · Deployed on **Vercel** (frontend) & **Render** (backend)

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://leadflow-crm.vercel.app)
[![API](https://img.shields.io/badge/⚡_Backend_API-Render-46E3B7?style=for-the-badge&logo=render)](https://leadflow-api.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-6366f1?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-43_Passing-22c55e?style=for-the-badge&logo=jest)](server/__tests__)

</div>

---

## ✨ What is LeadFlow?

LeadFlow is a production-ready **Customer Relationship Management (CRM)** platform I designed and built from scratch. It features a stunning **Solar Ocean glassmorphism UI**, a drag-and-drop Kanban pipeline, real-time analytics, automated reminders, and enterprise-grade security — all in a monorepo you can deploy in under 15 minutes.

> This project was built entirely by me — from architecture decisions to UI polish — as a showcase of full-stack engineering with React, Node.js, MongoDB, and modern DevOps.

---

## 🎯 Feature Highlights

| Area | Details |
|---|---|
| 🔐 **Auth & Security** | JWT access tokens (15 min) + httpOnly refresh tokens (7 days), rotation & reuse detection, RBAC (Admin / Manager / Sales Rep), rate-limited auth routes |
| 📋 **Lead Management** | Full CRUD, tags, custom fields, activity timeline, duplicate detection & merge, lead source tracking |
| 🗂 **Kanban Pipeline** | Drag-and-drop board powered by `@dnd-kit` with live stage transitions |
| 📊 **Analytics Dashboard** | Per-status KPIs, pipeline funnel, source donut, win/loss donut, 12-month trend line (Recharts) |
| 📤 **CSV Export** | Filtered lead exports for Admin & Manager roles |
| 🔔 **Reminders** | Per-lead follow-up tasks with due dates, in-app notification bell, email alerts via Nodemailer |
| 🔗 **Webhooks** | Inbound `POST /api/webhooks/leads` for Facebook Lead Ads / Zapier with HMAC-SHA256 verification |
| 📝 **Logging** | Structured Winston logs (colourised dev, JSON files in prod), HTTP via Morgan |
| ✅ **Tests** | 43 Jest + Supertest tests covering auth, leads CRUD, RBAC, and utilities |

---

## 🛠 Tech Stack

```
Frontend   React 19 · Vite 6 · React Router 7 · Axios · @dnd-kit · Recharts · Vanilla CSS
Backend    Node.js · Express 4 · MongoDB (Mongoose 8) · JWT · bcryptjs · Nodemailer
Security   Helmet · CORS · express-rate-limit · cookie-parser · express-validator · HMAC
Testing    Jest 29 · Supertest · Nodemon · Winston · Morgan
```

---

## 🗂 Project Structure

```
project/
├── client/                    React + Vite frontend (→ deploy on Vercel)
│   ├── src/
│   │   ├── components/        Shared UI components (Kanban, LeadTable, etc.)
│   │   ├── context/           AuthContext, ToastContext
│   │   ├── hooks/             useLeads, useReminders, useRole, useDebounce
│   │   ├── pages/             Dashboard, Leads, Pipeline, Analytics
│   │   └── services/          api.js (axios), leadService, authService
│   ├── .env.example           ← copy to .env and fill in
│   └── vite.config.js
│
├── server/                    Express + MongoDB backend (→ deploy on Render)
│   ├── __tests__/             43 Jest + Supertest tests
│   ├── config/                db.js
│   ├── middleware/            auth, authorize, errorHandler, validators
│   ├── models/                User, Lead, Reminder
│   ├── routes/                auth, leads, reminders, webhooks
│   ├── utils/                 logger, emailService, reminderScheduler, duplicateDetection
│   ├── .env.example           ← copy to .env and fill in  ⚠️ Never commit .env
│   └── server.js
│
├── vercel.json                Fullstack Vercel config (serverless option)
└── netlify.toml               Netlify frontend config (alternative)
```

---

## 🚀 Deployment Guide

> **Recommended:** Split deployment — Vercel (frontend) + Render (backend) + MongoDB Atlas (database)

### Step 1 — MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → create a **free M0 cluster**
2. **Database Access** → create a user with username/password
3. **Network Access** → Add `0.0.0.0/0` (allow all IPs, or add Render's static IPs later)
4. Click **Connect** → **Drivers** → copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/leadflow?retryWrites=true&w=majority
   ```
5. Save this — you'll paste it as `MONGO_URI` in Render.

---

### Step 2 — Deploy Backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo (`CRM-Dashboard`)
3. Configure the service:

   | Setting | Value |
   |---|---|
   | **Root directory** | `server` |
   | **Build command** | `npm install` |
   | **Start command** | `npm start` |

4. Under the **Environment** tab, add these variables:

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | `mongodb+srv://...` (from Step 1) |
   | `JWT_SECRET` | A long random string (e.g. generate with `openssl rand -hex 64`) |
   | `JWT_REFRESH_SECRET` | A **different** long random string |
   | `NODE_ENV` | `production` |
   | `CLIENT_ORIGIN` | `https://your-app.vercel.app` ← set after Step 3 |
   | `PORT` | `5000` |

5. Click **Deploy** → wait for it to go live.
6. Note your backend URL, e.g. `https://leadflow-api.onrender.com`

> 💡 **Generate strong secrets** (run locally):
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

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

3. Under **Environment Variables**, add:

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://leadflow-api.onrender.com/api` |

4. Click **Deploy** → you get a URL like `https://leadflow-crm.vercel.app`

---

### Step 4 — Wire CORS (Back on Render)

1. Go to your Render service → **Environment** tab
2. Update (or add) the `CLIENT_ORIGIN` variable:
   ```
   CLIENT_ORIGIN=https://leadflow-crm.vercel.app
   ```
3. Click **Save Changes** → Render will automatically redeploy.

✅ Your frontend on Vercel will now talk to the API on Render!

---

### Step 5 — Verify

- Open your Vercel URL → register a user → log in → create a lead
- Check Render logs for any errors
- Check MongoDB Atlas → **Collections** → you should see data

---

## 💻 Local Development

### Prerequisites

- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas URI

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/zainabhina05-png/CRM-Dashboard.git
cd CRM-Dashboard

# 2. Install server dependencies
cd server
npm install
cp .env.example .env
# Edit server/.env — fill in MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET

# 3. Install client dependencies
cd ../client
npm install
cp .env.example .env
# Default: VITE_API_BASE_URL=http://localhost:5000/api — no change needed locally

# 4. Start both servers (open two terminals)
# Terminal 1:
cd server && npm run dev      # Express on :5000

# Terminal 2:
cd client && npm run dev      # Vite on :5173
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` to `localhost:5000`.

---

## 🔒 Security & Privacy

> **Important:** This repo follows best practices for secret management.

- ✅ `.env` files are in `.gitignore` and **never committed**
- ✅ Only `.env.example` templates (with placeholder values) are tracked
- ✅ `node_modules/` and `dist/` build artifacts are excluded
- ✅ JWT secrets are never hardcoded — always loaded from environment
- ✅ Test files use `test_secret` placeholder values only
- ⚠️ When deploying, **generate fresh secrets** — never reuse dev values in production

---

## 🧪 Running Tests

```bash
cd server
npm test              # run all 43 tests once
npm run test:watch    # watch mode
```

Tests use a dedicated `leadflow_test` database and clean up after each run.

---

## 🔗 Webhook Integration

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

**Generate the HMAC signature:**
```js
const crypto = require('crypto');
const body = JSON.stringify(payload);
const sig = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
```

> The signature check is **skipped in development** (`NODE_ENV !== 'production'`) for easy local testing.

---

## 📝 Environment Variables Reference

### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for signing access tokens — **use a long random string** |
| `JWT_EXPIRES_IN` | | Access token TTL (default: `15m`) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret — **must differ from JWT_SECRET** |
| `JWT_REFRESH_EXPIRES_IN` | | Refresh token TTL (default: `7d`) |
| `PORT` | | Server port (default: `5000`) |
| `NODE_ENV` | | `development` \| `production` \| `test` |
| `CLIENT_ORIGIN` | | Production frontend URL for CORS (e.g. `https://your-app.vercel.app`) |
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
| `VITE_API_BASE_URL` | ✅ | Full URL to the backend API (e.g. `https://leadflow-api.onrender.com/api`) |

---

## 📋 Logging

In development, Winston prints colourised output to the console.  
In production (`NODE_ENV=production`), logs are written to:

- `server/logs/error.log` — errors only (5 MB max, 5 files)
- `server/logs/combined.log` — all levels (10 MB max, 10 files)

The `logs/` directory is gitignored.

---

## 🌐 Alternative Deployment Options

<details>
<summary><b>Option B — Fullstack on Vercel (Serverless)</b></summary>

The `vercel.json` at the repo root wraps the Express app as a serverless function.

> ⚠️ **Limitation:** The reminder scheduler (`setInterval`) will not persist between cold starts. Use a Vercel Cron Job or external service (EasyCron, Cronhooks) instead.

1. Import repo on Vercel (select **root** as project root)
2. Add **all** server environment variables in Vercel Project Settings → Environment Variables
3. Deploy — Vercel auto-detects `vercel.json`

</details>

<details>
<summary><b>Option C — Frontend on Netlify + Backend on Render</b></summary>

The `netlify.toml` is pre-configured for the client build.

1. Deploy backend to Render (same as Step 2 above)
2. Import `client` folder on Netlify
3. In `netlify.toml`, replace the redirect target:
   ```toml
   to = "https://your-render-service.onrender.com/api/:splat"
   ```
4. Add `VITE_API_BASE_URL` in Netlify Site Settings → Environment Variables

</details>

---

<div align="center">

**Built with ❤️ by [@zainabhina05-png](https://github.com/zainabhina05-png)**

*If this project helped you, a ⭐ on GitHub means a lot!*

</div>
