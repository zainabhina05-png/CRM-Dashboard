#!/usr/bin/env node

/**
 * Generate cryptographically secure JWT secrets for production deployment
 */

const crypto = require('crypto');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('LeadFlow CRM - JWT Secret Generator');
console.log('===================================');
console.log();
console.log('Add these environment variables to your Vercel project:');
console.log();
console.log('Backend Environment Variables:');
console.log('------------------------------');
console.log(`JWT_SECRET=${generateSecret()}`);
console.log(`JWT_REFRESH_SECRET=${generateSecret()}`);
console.log(`WEBHOOK_SECRET=${generateSecret(32)}`);
console.log();
console.log('Additional Required Variables:');
console.log('-----------------------------');
console.log('NODE_ENV=production');
console.log('MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/leadflow');
console.log('CLIENT_ORIGIN=https://your-frontend-domain.vercel.app');
console.log();
console.log('Optional Email Variables:');
console.log('------------------------');
console.log('SMTP_HOST=smtp.gmail.com');
console.log('SMTP_PORT=587');
console.log('SMTP_SECURE=false');
console.log('SMTP_USER=your-email@gmail.com');
console.log('SMTP_PASS=your-app-password');
console.log('SMTP_FROM=LeadFlow <no-reply@leadflow.app>');
console.log();
console.log('Frontend Environment Variables:');
console.log('-------------------------------');
console.log('VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api');
console.log();
console.log('⚠️  Security Note: Never commit these secrets to git!');
console.log('📋  Copy these values to your Vercel project settings.');