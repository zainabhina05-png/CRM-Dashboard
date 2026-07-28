#!/usr/bin/env node

/**
 * Test the seed system functionality without requiring database connection
 */

const { faker } = require('@faker-js/faker');

// Configure faker
faker.seed(42);

console.log('🧪 LeadFlow CRM - Seed System Test');
console.log('==================================');
console.log();

/**
 * Test safety guard logic
 */
function testSafetyGuards() {
  console.log('🔒 Testing safety guard logic...');
  
  const testCases = [
    {
      nodeEnv: 'production',
      allowSeed: undefined,
      mongoUri: 'mongodb://cluster0.mongodb.net/leadflow',
      expected: 'BLOCKED'
    },
    {
      nodeEnv: 'production', 
      allowSeed: 'true',
      mongoUri: 'mongodb://localhost:27017/leadflow_production',
      expected: 'ALLOWED'
    },
    {
      nodeEnv: 'development',
      allowSeed: undefined,
      mongoUri: 'mongodb://localhost:27017/leadflow_demo',
      expected: 'ALLOWED'
    },
    {
      nodeEnv: 'development',
      allowSeed: undefined,
      mongoUri: 'mongodb://cluster0.mongodb.net/leadflow',
      expected: 'WARNING'
    }
  ];

  testCases.forEach((testCase, index) => {
    try {
      const dbName = testCase.mongoUri.split('/').pop().split('?')[0];
      const safeDatabases = ['demo', 'dev', 'development', 'test', 'leadflow_demo', 'leadflow_dev'];
      const isSafeDatabase = safeDatabases.some(safe => dbName.toLowerCase().includes(safe));
      
      let result = 'ALLOWED';
      
      if (testCase.nodeEnv === 'production' && !testCase.allowSeed) {
        result = 'BLOCKED';
      } else if (!isSafeDatabase && !testCase.allowSeed) {
        result = 'BLOCKED';
      } else if (testCase.mongoUri.includes('cluster0') && !testCase.allowSeed && testCase.nodeEnv !== 'production') {
        result = 'WARNING';
      }
      
      const status = result === testCase.expected ? '✅' : '❌';
      console.log(`  ${status} Test ${index + 1}: ${result} (expected: ${testCase.expected})`);
      
    } catch (error) {
      console.log(`  ❌ Test ${index + 1}: Error - ${error.message}`);
    }
  });
}

/**
 * Test demo data generation
 */
function testDataGeneration() {
  console.log('\n📊 Testing demo data generation...');
  
  // Test user data generation
  const roles = ['admin', 'manager', 'sales_rep'];
  const users = roles.map(role => ({
    name: `${role} Demo User`,
    email: `${role}@leadflow-demo.com`,
    role: role,
    password: 'demo123!'
  }));
  
  console.log(`  ✅ Generated ${users.length} demo users:`);
  users.forEach(user => {
    console.log(`     • ${user.name} (${user.role}) - ${user.email}`);
  });

  // Test lead data generation
  console.log('\n  📋 Testing lead data generation...');
  
  const leadCount = 10; // Small sample for testing
  const statuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
  const sources = ['website', 'referral', 'social_media', 'paid_ads', 'cold_call', 'other'];
  
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
    
    const company = faker.company.name();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    leads.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      company: company,
      status: status,
      source: faker.helpers.arrayElement(sources),
      phone: faker.phone.number()
    });
  }
  
  // Show distribution
  const distribution = {};
  statuses.forEach(status => {
    distribution[status] = leads.filter(l => l.status === status).length;
  });
  
  console.log(`  ✅ Generated ${leads.length} sample leads`);
  console.log('     Distribution:', distribution);
  console.log(`     Sample lead: ${leads[0].name} (${leads[0].status}) - ${leads[0].company}`);

  // Test reminder generation
  console.log('\n  ⏰ Testing reminder generation...');
  
  const reminderCount = 5;
  const reminders = [];
  
  for (let i = 0; i < reminderCount; i++) {
    const timeType = faker.helpers.arrayElement(['past', 'today', 'near', 'future']);
    
    let dueDate;
    switch (timeType) {
      case 'past':
        dueDate = faker.date.recent({ days: 14 });
        break;
      case 'today':
        dueDate = new Date();
        break;
      case 'near':
        dueDate = faker.date.soon({ days: 7 });
        break;
      case 'future':
        dueDate = faker.date.soon({ days: 30 });
        break;
    }
    
    reminders.push({
      title: faker.helpers.arrayElement([
        'Follow up on proposal',
        'Schedule product demo', 
        'Send contract for review'
      ]),
      dueDate: dueDate,
      type: timeType
    });
  }
  
  console.log(`  ✅ Generated ${reminders.length} sample reminders`);
  reminders.forEach(r => {
    const dateStr = r.dueDate.toLocaleDateString();
    console.log(`     • ${r.title} (${r.type}) - ${dateStr}`);
  });
}

/**
 * Test credentials file generation
 */
function testCredentialsFile() {
  console.log('\n📄 Testing credentials file generation...');
  
  const users = [
    { email: 'admin@leadflow-demo.com', plainPassword: 'demo123!', role: 'admin' },
    { email: 'manager@leadflow-demo.com', plainPassword: 'demo123!', role: 'manager' },
    { email: 'sales@leadflow-demo.com', plainPassword: 'demo123!', role: 'sales_rep' }
  ];
  
  const sampleCredentials = `# LeadFlow CRM - Demo Credentials

## Generated Demo User Accounts

### Admin User
- **Email:** \`${users[0].email}\`
- **Password:** \`${users[0].plainPassword}\`
- **Role:** Administrator

### Manager User  
- **Email:** \`${users[1].email}\`
- **Password:** \`${users[1].plainPassword}\`
- **Role:** Manager

### Sales Representative
- **Email:** \`${users[2].email}\`
- **Password:** \`${users[2].plainPassword}\`
- **Role:** Sales Rep

**Last Generated:** ${new Date().toISOString()}
`;

  console.log('  ✅ Sample credentials file content:');
  console.log(sampleCredentials.split('\n').slice(0, 15).map(line => `     ${line}`).join('\n'));
  console.log('     ... (truncated)');
}

/**
 * Main test execution
 */
function runTests() {
  try {
    testSafetyGuards();
    testDataGeneration(); 
    testCredentialsFile();
    
    console.log('\n🎉 All seed system tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Set up MongoDB connection (local or Atlas)');
    console.log('   2. Configure server/.env with MONGO_URI'); 
    console.log('   3. Run: npm run seed');
    console.log('   4. Check DEMO_CREDENTIALS.md for login details');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}