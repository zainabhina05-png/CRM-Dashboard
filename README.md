# LeadFlow

A MERN stack Lead Management CRM with a modern glassmorphism UI ("Solar Ocean" theme).

## Features
- Full authentication (JWT, bcrypt)
- Lead pipeline management (CRUD)
- Real-time status badge updates
- Full-text search and status filtering
- Dashboard analytics with visualizations
- Responsive glassmorphism interface

## Tech Stack
**Frontend:** React 19, Vite, React Router, Axios, Vanilla CSS (Glassmorphism)
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Express-Validator
**Security:** Helmet, Express Rate Limit, CORS, Compression

## Getting Started

1. Clone the repository
2. Install dependencies:
   - `npm install` (root)
   - `cd server && npm install`
   - `cd client && npm install`
3. Configure environments:
   - Copy `server/.env.example` to `server/.env` and fill in your MongoDB URI and JWT Secret
   - Copy `client/.env.example` to `client/.env` (no changes needed for local development)
4. Start development servers:
   - Run `npm run dev` in the root directory to start both client and server concurrently.

## Deployment Guide

### Option 1: Vercel (Monorepo)
The repository includes a `vercel.json` file configured to deploy both the React frontend and Express backend.
1. Import the repository in Vercel
2. Add the environment variables from `server/.env.example` to the Vercel project settings.
3. Deploy!

### Option 2: Netlify (Frontend) + Render (Backend)
1. Deploy the `server` folder to Render or a similar Node.js hosting platform.
2. Deploy the `client` folder to Netlify. The `netlify.toml` file is already configured.
3. In Netlify, add `VITE_API_BASE_URL` pointing to your backend.
4. In Render, add `CLIENT_ORIGIN` pointing to your Netlify URL.
