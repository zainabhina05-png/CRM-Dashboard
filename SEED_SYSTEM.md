# LeadFlow CRM - Demo Seed System

## Overview

The LeadFlow CRM demo seed system provides a safe, idempotent way to generate realistic demo data for development, testing, and demonstration purposes. It includes comprehensive production safety guards and creates complete relational integrity across all data models.

## Features

### 🔒 Production Safety Guards
- **Environment Protection**: Blocks execution in production unless explicitly overridden
- **Database Name Validation**: Requires 'demo' or 'dev' in database names for safety
- **Atlas Cluster Warning**: Warns when targeting production-like MongoDB Atlas clusters
- **Override Capability**: `ALLOW_SEED=true` environment variable bypasses safety checks

### 📊 Realistic Demo Data
- **3 Demo Users**: One per role (admin, manager, sales_rep) with printed credentials
- **85 Realistic Leads**: Distributed across pipeline stages with proper progression
- **35 Demo Reminders**: Mix of overdue, current, and future reminders
- **Complete Activities**: Full activity timeline for each lead with realistic progressions
- **Relational Integrity**: All foreign keys properly maintained across models

### 🔄 Idempotent Operations
- **Safe Re-execution**: Can be run multiple times without issues
- **Complete Cleanup**: Clears existing data before generating new data
- **Asset Management**: `seed:reset` command clears data and removes credential files

## Usage

### Basic Commands

```bash
# Generate demo data
npm run seed

# Clear demo data and assets
npm run seed:reset

# Test seed system (no database required)
npm run test:seed

# Show help
node scripts/seed.js --help
```

### Environment Setup

**Option 1: Local MongoDB**
```bash
# Start MongoDB locally
mongod --dbpath /path/to/data

# Configure environment (server/.env)
MONGO_URI=mongodb://localhost:27017/leadflow_demo
ALLOW_SEED=true
```

**Option 2: MongoDB Atlas**
```bash
# Configure environment (server/.env)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/leadflow_demo
ALLOW_SEED=true
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

## Generated Data Structure

### Demo Users
| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | admin@leadflow-demo.com | demo123! | Full system access |
| Manager | manager@leadflow-demo.com | demo123! | Team management, exports |
| Sales Rep | sales@leadflow-demo.com | demo123! | Own leads only |

### Lead Distribution
- **New**: ~25% (Fresh leads, initial contact)
- **Contacted**: ~20% (First contact made) 
- **Qualified**: ~15% (Budget/need confirmed)
- **Proposal**: ~10% (Pricing sent)
- **Won**: ~15% (Closed deals)
- **Lost**: ~15% (Lost opportunities)

### Reminder Types
- **Overdue**: ~30% (Past due dates, some completed)
- **Due Today**: ~20% (Immediate attention needed)
- **Upcoming**: ~35% (Next 7-30 days)
- **Completed**: ~15% (Historical completed tasks)

## Safety Features

### Production Protection
```javascript
// Environment check
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
  throw new Error('SEED BLOCKED: Cannot run in production');
}

// Database name validation
const safeDatabases = ['demo', 'dev', 'development', 'test'];
if (!safeDatabases.some(safe => dbName.includes(safe)) && !process.env.ALLOW_SEED) {
  throw new Error('SEED BLOCKED: Database name not recognized as demo/dev');
}
```

### Data Integrity
- All leads have valid owners (users)
- All activities reference existing users and leads
- All reminders link to existing leads and users
- Proper timestamps and progression logic
- Realistic email addresses and phone numbers

## Output Files

### DEMO_CREDENTIALS.md
Automatically generated file containing:
- Login credentials for all demo users
- Role descriptions and permissions
- Data summary (counts, distribution)
- Usage instructions
- Security notes

### Example Output
```
🌱 LeadFlow CRM - Demo Data Seed System
=====================================

🔒 Checking production safety guards...
✅ Safety checks passed. Target database: leadflow_demo

🧹 Clearing existing demo data...
✅ Cleared data: 3 users, 85 leads, 35 reminders

👥 Creating demo users...
✅ Created 3 demo users

📊 Creating demo leads...
📈 Lead status distribution: { New: 21, Contacted: 17, Qualified: 13, Proposal: 8, Won: 13, Lost: 13 }
✅ Created 85 demo leads with realistic distribution

⏰ Creating demo reminders...
📅 Reminder distribution: { overdue: 8, dueToday: 5, upcoming: 15, completed: 7 }
✅ Created 35 demo reminders

✅ Demo credentials written to: DEMO_CREDENTIALS.md

🎉 Demo data seeding completed successfully!
⏱️  Total time: 3.47 seconds

📋 Summary:
   • 3 demo users created
   • 85 leads with realistic distribution  
   • 35 reminders with varied due dates
   • Complete relational integrity maintained

📧 Demo credentials available in: DEMO_CREDENTIALS.md
🚀 Ready to test the application with realistic demo data!
```

## Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
❌ Database connection failed: Cannot connect to MongoDB

Solutions:
1. Start local MongoDB: mongod --dbpath /path/to/data
2. Check MONGO_URI in server/.env
3. Verify network connectivity to Atlas
4. Check database authentication credentials
```

**Production Safety Blocks:**
```bash
❌ SEED BLOCKED: Cannot run seed script in production environment

Solutions:
1. Change NODE_ENV to development
2. Use database with 'demo' or 'dev' in name
3. Set ALLOW_SEED=true (use with caution)
```

**Permission Errors:**
```bash
❌ Failed to clear demo data: User not authorized

Solutions:
1. Check MongoDB user permissions
2. Ensure user has read/write access to target database
3. Verify connection string includes correct username/password
```

## Integration

### CI/CD Pipeline
The seed system integrates with the deployment workflow:

```yaml
# GitHub Actions example
- name: Seed demo database
  run: npm run seed
  env:
    MONGO_URI: ${{ secrets.DEMO_MONGO_URI }}
    ALLOW_SEED: true
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

### Development Workflow
1. **Initial Setup**: Run `npm run seed` after database setup
2. **Data Refresh**: Run `npm run seed` when demo data becomes stale
3. **Clean Reset**: Run `npm run seed:reset` before production deployment
4. **Testing**: Use generated credentials for manual testing and demos

### Production Considerations
- Never run against production databases without explicit override
- Use separate demo/staging databases
- Regularly refresh demo data to maintain realistic test scenarios
- Include seed operation in development environment setup documentation

This seed system provides a robust foundation for consistent, safe demo data generation across all environments while maintaining production safety and data integrity.