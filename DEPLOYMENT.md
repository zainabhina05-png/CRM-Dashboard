# LeadFlow CRM - Deployment Guide

## Fixed Issues & Solutions

### Root Cause of 404 Errors
The deployment 404 errors were caused by:
1. **Incorrect Vercel Configuration**: Missing proper monorepo configuration
2. **Environment Variables**: Required environment variables not set in Vercel projects
3. **Build Configuration**: Client build not properly configured for Vite
4. **Server Export**: Server needed proper serverless function configuration

### Fixes Applied
1. **Added Root-Level vercel.json**: Proper monorepo configuration with separate builds
2. **Updated Client Configuration**: Optimized for Vite static build with SPA routing  
3. **Enhanced Server Configuration**: Added function timeout and environment settings
4. **Build Verification**: Confirmed both client and server build successfully

## Deployment Steps

### Prerequisites
- Vercel account with CLI installed: `npm i -g vercel`
- MongoDB Atlas database with connection string
- Generated JWT secrets (see Environment Variables section)

### Step 1: Deploy Backend (API)

```bash
# Navigate to server directory
cd server

# Deploy to Vercel
vercel --prod

# Configure environment variables in Vercel dashboard:
# - MONGO_URI
# - JWT_SECRET  
# - JWT_REFRESH_SECRET
# - CLIENT_ORIGIN (set after frontend deployment)
```

**Required Environment Variables for Backend:**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/leadflow
JWT_SECRET=<64-character-random-string>
JWT_REFRESH_SECRET=<different-64-character-random-string>  
NODE_ENV=production
CLIENT_ORIGIN=https://your-frontend-domain.vercel.app
SMTP_HOST=smtp.gmail.com (optional)
SMTP_PORT=587 (optional)
SMTP_USER=your-email@gmail.com (optional)
SMTP_PASS=your-app-password (optional)
WEBHOOK_SECRET=<webhook-signing-secret> (optional)
WEBHOOK_OWNER_ID=<mongodb-user-id> (optional)
```

### Step 2: Deploy Frontend

```bash
# Navigate to client directory  
cd client

# Deploy to Vercel
vercel --prod

# Configure environment variables in Vercel dashboard:
# - VITE_API_BASE_URL (backend URL from Step 1)
```

**Required Environment Variables for Frontend:**
```
VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api
```

### Step 3: Update CORS Configuration

After both deployments:
1. Get the frontend URL from Vercel
2. Update the backend's `CLIENT_ORIGIN` environment variable
3. Redeploy the backend to apply CORS settings

### Step 4: Verify Deployment

Test the following endpoints:
- **Backend Health**: `GET https://your-backend-domain.vercel.app/api/health`
- **Frontend**: Visit `https://your-frontend-domain.vercel.app`
- **Registration**: Create a test account
- **API Integration**: Verify frontend can communicate with backend

## Alternative Deployment (Traditional Server)

If serverless limitations become problematic:

### Backend on Render/Railway:
```bash
# Add to server/package.json
{
  "scripts": {
    "build": "npm install",
    "start": "node server.js"
  }
}
```

### Environment Configuration:
- Set `NODE_ENV=production`
- Configure all environment variables
- Ensure MongoDB Atlas allows connections from hosting provider

## Troubleshooting

### Common Issues:

**500 Internal Server Error:**
- Check environment variables are set correctly
- Verify MongoDB connection string and network access
- Check Vercel function logs for specific errors

**CORS Errors:**
- Ensure `CLIENT_ORIGIN` matches exact frontend URL (including https://)
- Verify frontend is using correct `VITE_API_BASE_URL`

**Database Connection Issues:**
- Verify MongoDB Atlas connection string
- Check IP whitelist includes `0.0.0.0/0` or Vercel IPs
- Ensure database user has read/write permissions

**Build Failures:**
- Check Node.js version compatibility
- Verify all dependencies are listed in package.json
- Clear node_modules and reinstall if needed

### Performance Optimization:
- Monitor Vercel function execution time (10s limit)
- Consider connection pooling for high-traffic scenarios
- Implement caching for frequently accessed data

## Monitoring & Maintenance

### Health Checks:
- **Backend**: `GET /api/health` should return 200 with success message
- **Database**: Monitor MongoDB Atlas dashboard for connection metrics
- **Frontend**: Verify SPA routing works for all pages

### Regular Tasks:
- Update dependencies monthly for security patches
- Monitor Vercel function usage and billing
- Review MongoDB Atlas storage and bandwidth usage
- Check security vulnerabilities with `npm audit`

## Security Checklist

- ✅ HTTPS enforced on all environments
- ✅ Environment variables never committed to git
- ✅ JWT secrets are cryptographically strong (64+ chars)
- ✅ CORS restricted to specific frontend domain
- ✅ Rate limiting active on authentication endpoints
- ✅ MongoDB connection uses authentication
- ✅ No sensitive data in client-side code

This deployment configuration provides a scalable, secure foundation for the LeadFlow CRM system.