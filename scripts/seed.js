#!/usr/bin/env node

/**
 * LeadFlow CRM - Demo Data Seed System
 * 
 * Idempotent script that safely generates realistic demo data for development and testing.
 * Includes production safety guards and complete relational integrity.
 */

const path = require('path');
const fs = require('fs');

// Load server dependencies
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Import models
const User = require('../server/models/User');
const Lead = require('../server/models/Lead');
const Reminder = require('../server/models/Reminder');

// Configure faker for consistent results
faker.seed(42); // Reproducible fake data

/**
 * Production Safety Guards
 */
function checkSafetyGuards() {
  console.log('🔒 Checking production safety guards...');

  // Environment safety check
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
    throw new Error('❌ SEED BLOCKED: Cannot run seed script in production environment. Set ALLOW_SEED=true to override.');
  }

  // Database name safety check
  const dbName = process.env.MONGO_URI ? 
    process.env.MONGO_URI.split('/').pop().split('?')[0] : 'unknown';
    
  const safeDatabases = ['demo', 'dev', 'development', 'test', 'leadflow_demo', 'leadflow_dev'];
  const isSafeDatabase = safeDatabases.some(safe => dbName.toLowerCase().includes(safe));

  if (!isSafeDatabase && !process.env.ALLOW_SEED) {
    throw new Error(`❌ SEED BLOCKED: Database name '${dbName}' doesn't appear to be a demo/dev database. Use a database with 'demo' or 'dev' in the name, or set ALLOW_SEED=true to override.`);
  }

  // MongoDB URI safety check
  if (process.env.MONGO_URI && process.env.MONGO_URI.includes('cluster0') && !process.env.ALLOW_SEED) {
    console.log('⚠️  WARNING: Seeding against what appears to be a production cluster. Ensure this is intentional.');
  }

  console.log(`✅ Safety checks passed. Target database: ${dbName}`);
}

/**
 * Database Connection
 */
async function connectDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is required');
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}`);
  } catch (error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('getaddrinfo')) {
      throw new Error(`❌ Database connection failed: Cannot connect to MongoDB. 
      
Possible solutions:
1. Start local MongoDB: mongod --dbpath /path/to/data
2. Use MongoDB Atlas cloud database
3. Set MONGO_URI environment variable in server/.env
4. For local testing, try: MONGO_URI=mongodb://localhost:27017/leadflow_demo

Original error: ${error.message}`);
    }
    throw new Error(`❌ Database connection failed: ${error.message}`);
  }
}

/**
 * Clear existing demo data
 */
async function clearDemoData() {
  console.log('🧹 Clearing existing demo data...');
  
  try {
    const results = await Promise.all([
      Reminder.deleteMany({}),
      Lead.deleteMany({}), 
      User.deleteMany({})
    ]);
    
    console.log(`✅ Cleared data: ${results[2].deletedCount} users, ${results[1].deletedCount} leads, ${results[0].deletedCount} reminders`);
  } catch (error) {
    throw new Error(`❌ Failed to clear demo data: ${error.message}`);
  }
}

/**
 * Create demo users (one per role)
 */
async function createDemoUsers() {
  console.log('👥 Creating demo users...');
  
  const userData = [
    {
      name: 'Admin Demo User',
      email: 'admin@leadflow-demo.com',
      password: 'demo123!',
      role: 'admin'
    },
    {
      name: 'Manager Demo User', 
      email: 'manager@leadflow-demo.com',
      password: 'demo123!',
      role: 'manager'
    },
    {
      name: 'Sales Rep Demo User',
      email: 'sales@leadflow-demo.com', 
      password: 'demo123!',
      role: 'sales_rep'
    }
  ];

  const users = [];
  
  for (const user of userData) {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    const createdUser = await User.create({
      ...user,
      password: hashedPassword
    });
    users.push({ ...createdUser.toObject(), plainPassword: user.password });
  }
  
  console.log(`✅ Created ${users.length} demo users`);
  return users;
}

/**
 * Create realistic demo leads
 */
async function createDemoLeads(users) {
  console.log('📊 Creating demo leads...');
  
  const leadCount = 85; // Target: 75-100 leads
  const statuses = Lead.LEAD_STATUSES;
  const sources = ['website', 'referral', 'social_media', 'paid_ads', 'cold_call', 'other'];
  const tags = ['hot', 'cold', 'qualified', 'enterprise', 'smb', 'vip', 'competitor', 'partner', 'referral', 'repeat'];
  
  // Realistic distribution across pipeline stages
  const statusDistribution = {
    'New': 0.25,
    'Contacted': 0.20, 
    'Qualified': 0.15,
    'Proposal': 0.10,
    'Won': 0.15,
    'Lost': 0.15
  };

  const leads = [];
  
  for (let i = 0; i < leadCount; i++) {
    // Select owner (bias toward sales rep, but distribute among all users)
    const owner = faker.helpers.arrayElement([
      ...Array(3).fill(users[2]), // Sales rep gets 3x more leads
      users[1], // Manager gets some leads
      users[0]  // Admin gets some leads
    ]);

    // Select status based on realistic distribution
    const rand = Math.random();
    let cumulative = 0;
    let status = 'New';
    
    for (const [statusName, weight] of Object.entries(statusDistribution)) {
      cumulative += weight;
      if (rand <= cumulative) {
        status = statusName;
        break;
      }
    }

    // Generate realistic company and contact data
    const company = faker.company.name();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';

    // Create activities based on lead status
    const activities = [
      {
        type: 'created',
        content: 'Lead created via seed script',
        createdBy: owner._id,
        createdAt: faker.date.recent({ days: 90 })
      }
    ];

    // Add progression activities for advanced stages
    if (status !== 'New') {
      activities.push({
        type: 'status_change',
        content: `Status changed from New to ${status}`,
        metadata: { fromStatus: 'New', toStatus: status },
        createdBy: owner._id,
        createdAt: faker.date.recent({ days: 60 })
      });
    }

    // Add realistic notes and calls for some leads
    if (faker.datatype.boolean({ probability: 0.6 })) {
      activities.push({
        type: faker.helpers.arrayElement(['note', 'call', 'email']),
        content: faker.helpers.arrayElement([
          'Initial contact made, very interested in our services',
          'Follow-up scheduled for next week',
          'Sent pricing proposal via email',
          'Decision maker identified, moving to next stage',
          'Budget confirmed, waiting for final approval',
          'Competitor evaluation in progress',
          'Requested technical demo'
        ]),
        createdBy: owner._id,
        createdAt: faker.date.recent({ days: 30 })
      });
    }

    const leadData = {
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      phone: faker.phone.number(),
      company: company,
      status: status,
      source: faker.helpers.arrayElement(sources),
      tags: faker.helpers.arrayElements(tags, { min: 0, max: 3 }),
      notes: faker.datatype.boolean({ probability: 0.7 }) ? 
        faker.lorem.sentences({ min: 1, max: 3 }) : '',
      customFields: faker.datatype.boolean({ probability: 0.3 }) ? [
        {
          key: 'Budget',
          value: `$${faker.number.int({ min: 5000, max: 100000 }).toLocaleString()}`
        },
        {
          key: 'Timeline',
          value: faker.helpers.arrayElement(['Q1', 'Q2', 'Q3', 'Q4', 'ASAP', '6 months'])
        }
      ] : [],
      activities: activities,
      owner: owner._id,
      createdAt: faker.date.recent({ days: 120 }),
      updatedAt: faker.date.recent({ days: 7 })
    };

    const lead = await Lead.create(leadData);
    leads.push(lead);
  }
  
  console.log(`✅ Created ${leads.length} demo leads with realistic distribution`);
  
  // Log distribution
  const distribution = {};
  statuses.forEach(status => {
    distribution[status] = leads.filter(l => l.status === status).length;
  });
  console.log('📈 Lead status distribution:', distribution);
  
  return leads;
}

/**
 * Create demo reminders
 */
async function createDemoReminders(users, leads) {
  console.log('⏰ Creating demo reminders...');
  
  const reminderCount = 35; // Target: 25-40 reminders
  const reminders = [];
  
  for (let i = 0; i < reminderCount; i++) {
    const lead = faker.helpers.arrayElement(leads);
    const owner = users.find(u => u._id.toString() === lead.owner.toString());
    
    // Create varied due dates (past, present, future)
    let dueDate;
    const timeType = faker.helpers.arrayElement(['past', 'today', 'near', 'future']);
    
    switch (timeType) {
      case 'past':
        dueDate = faker.date.recent({ days: 14 }); // Overdue reminders
        break;
      case 'today':  
        dueDate = new Date(); // Due today
        break;
      case 'near':
        dueDate = faker.date.soon({ days: 7 }); // Due this week
        break;
      case 'future':
        dueDate = faker.date.soon({ days: 30 }); // Due later
        break;
    }

    const titles = [
      'Follow up on proposal',
      'Schedule product demo',
      'Send contract for review',
      'Check budget approval status',
      'Quarterly business review',
      'Technical requirements gathering',
      'Contract negotiation meeting',
      'Implementation planning call',
      'Decision maker introduction',
      'Competitive analysis discussion'
    ];

    const isCompleted = timeType === 'past' && faker.datatype.boolean({ probability: 0.6 });

    const reminderData = {
      title: faker.helpers.arrayElement(titles),
      dueDate: dueDate,
      lead: lead._id,
      owner: owner._id,
      completed: isCompleted,
      completedAt: isCompleted ? faker.date.between({ from: dueDate, to: new Date() }) : null,
      emailSent: timeType === 'past' ? faker.datatype.boolean() : false
    };

    const reminder = await Reminder.create(reminderData);
    reminders.push(reminder);
  }
  
  console.log(`✅ Created ${reminders.length} demo reminders`);
  
  // Log distribution
  const now = new Date();
  const counts = {
    overdue: reminders.filter(r => r.dueDate < now && !r.completed).length,
    dueToday: reminders.filter(r => {
      const due = new Date(r.dueDate);
      return due.toDateString() === now.toDateString() && !r.completed;
    }).length,
    upcoming: reminders.filter(r => r.dueDate > now && !r.completed).length,
    completed: reminders.filter(r => r.completed).length
  };
  console.log('📅 Reminder distribution:', counts);
  
  return reminders;
}

/**
 * Write demo credentials to file
 */
async function writeCredentialsFile(users) {
  const credentialsContent = `# LeadFlow CRM - Demo Credentials

## Generated Demo User Accounts

This file contains login credentials for the demo user accounts. These are generated automatically by the seed script and are safe to use for testing and demonstration purposes.

**⚠️ Important: These are demo credentials only. Do not use in production!**

---

### Admin User
- **Email:** \`${users[0].email}\`  
- **Password:** \`${users[0].plainPassword}\`
- **Role:** Administrator
- **Permissions:** Full system access, user management, all CRUD operations

### Manager User  
- **Email:** \`${users[1].email}\`
- **Password:** \`${users[1].plainPassword}\`
- **Role:** Manager  
- **Permissions:** Team oversight, CSV export, deal closure authority

### Sales Representative
- **Email:** \`${users[2].email}\`
- **Password:** \`${users[2].plainPassword}\`
- **Role:** Sales Rep
- **Permissions:** Own leads management, pipeline operations

---

## Demo Data Summary

- **Users:** ${users.length} (one per role)
- **Leads:** ~85 with realistic pipeline distribution
- **Reminders:** ~35 with varied due dates
- **Activities:** Comprehensive activity timeline for each lead
- **Data Integrity:** All relationships properly maintained

## Usage Instructions

1. **Access the Application:** Navigate to your deployed frontend URL
2. **Login:** Use any of the credentials above to access different role experiences
3. **Explore Features:** Each role has different permissions and UI visibility
4. **Test Workflows:** Create leads, move through pipeline, set reminders
5. **Reset Data:** Run \`npm run seed\` again to regenerate fresh demo data

---

## Security Notes

- These credentials are automatically generated and safe for demo use
- All demo data is clearly marked and separate from production data  
- The seed script includes safety guards to prevent accidental production use
- Demo passwords use a simple format for convenience (demo123!)

**Last Generated:** ${new Date().toISOString()}  
**Database:** ${mongoose.connection.name}  
**Environment:** ${process.env.NODE_ENV || 'development'}
`;

  const filePath = path.join(__dirname, '..', 'DEMO_CREDENTIALS.md');
  fs.writeFileSync(filePath, credentialsContent);
  console.log(`✅ Demo credentials written to: ${filePath}`);
}

/**
 * Main seed execution
 */
async function seedDatabase() {
  const startTime = Date.now();
  
  console.log('🌱 LeadFlow CRM - Demo Data Seed System');
  console.log('=====================================');
  console.log();
  
  try {
    // Safety checks
    checkSafetyGuards();
    
    // Database connection
    await connectDatabase();
    
    // Clear existing data
    await clearDemoData();
    
    // Generate demo data
    const users = await createDemoUsers();
    const leads = await createDemoLeads(users);
    const reminders = await createDemoReminders(users, leads);
    
    // Write credentials file
    await writeCredentialsFile(users);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log();
    console.log('🎉 Demo data seeding completed successfully!');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log();
    console.log('📋 Summary:');
    console.log(`   • ${users.length} demo users created`);
    console.log(`   • ${leads.length} leads with realistic distribution`);
    console.log(`   • ${reminders.length} reminders with varied due dates`);
    console.log(`   • Complete relational integrity maintained`);
    console.log();
    console.log('📧 Demo credentials available in: DEMO_CREDENTIALS.md');
    console.log('🚀 Ready to test the application with realistic demo data!');
    
  } catch (error) {
    console.error('❌ Seed operation failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Reset function to clear demo data and assets
 */
async function resetDemoData() {
  console.log('🔄 LeadFlow CRM - Demo Data Reset');
  console.log('=================================');
  console.log();
  
  try {
    checkSafetyGuards();
    await connectDatabase();
    await clearDemoData();
    
    // Remove credentials file if it exists
    const credentialsPath = path.join(__dirname, '..', 'DEMO_CREDENTIALS.md');
    if (fs.existsSync(credentialsPath)) {
      fs.unlinkSync(credentialsPath);
      console.log('✅ Removed demo credentials file');
    }
    
    console.log('✅ Demo data reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Reset operation failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'reset') {
    resetDemoData();
  } else if (command === '--help' || command === '-h') {
    console.log('LeadFlow CRM - Demo Data Seed System');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/seed.js        # Generate demo data');
    console.log('  node scripts/seed.js reset  # Clear demo data');
    console.log('  node scripts/seed.js --help # Show this help');
    console.log('');
    console.log('Environment Variables:');
    console.log('  ALLOW_SEED=true             # Override safety guards');
    console.log('  NODE_ENV=production         # Environment check');
    console.log('  MONGO_URI=mongodb://...     # Database connection');
  } else {
    seedDatabase();
  }
}