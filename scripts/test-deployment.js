#!/usr/bin/env node

/**
 * Test deployment endpoints to verify they're working correctly
 */

const https = require('https');
const http = require('http');

async function testEndpoint(url, description) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 300;
        resolve({
          url,
          description,
          status: res.statusCode,
          success,
          data: data ? JSON.parse(data) : null
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        description,
        status: null,
        success: false,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        description,
        status: null,
        success: false,
        error: 'Timeout'
      });
    });
  });
}

async function testDeployment() {
  console.log('LeadFlow CRM - Deployment Test');
  console.log('==============================');
  console.log();

  // Get URLs from command line arguments or use defaults
  const backendUrl = process.argv[2] || 'https://leadflow-crm-backend.vercel.app';
  const frontendUrl = process.argv[3] || 'https://leadflow-crm-frontend.vercel.app';

  const tests = [
    {
      url: `${backendUrl}/api/health`,
      description: 'Backend Health Check'
    },
    {
      url: `${backendUrl}/api/debug`,
      description: 'Backend Debug Info'
    },
    {
      url: frontendUrl,
      description: 'Frontend Accessibility'
    }
  ];

  console.log('Testing deployment endpoints...');
  console.log();

  const results = [];
  for (const test of tests) {
    process.stdout.write(`Testing ${test.description}... `);
    const result = await testEndpoint(test.url, test.description);
    results.push(result);
    
    if (result.success) {
      console.log('✅ PASS');
    } else {
      console.log('❌ FAIL');
    }
  }

  console.log();
  console.log('Detailed Results:');
  console.log('================');

  results.forEach((result) => {
    console.log(`\n${result.description}:`);
    console.log(`  URL: ${result.url}`);
    console.log(`  Status: ${result.status || 'ERROR'}`);
    console.log(`  Success: ${result.success ? '✅' : '❌'}`);
    
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    
    if (result.data && result.success) {
      console.log(`  Response: ${JSON.stringify(result.data, null, 2)}`);
    }
  });

  const allPassed = results.every(r => r.success);
  
  console.log();
  console.log('Summary:');
  console.log(`========`);
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  console.log(`Overall: ${allPassed ? '✅ DEPLOYMENT HEALTHY' : '❌ DEPLOYMENT ISSUES'}`);

  if (!allPassed) {
    console.log();
    console.log('Troubleshooting:');
    console.log('- Check Vercel project configuration');
    console.log('- Verify environment variables are set');
    console.log('- Check function logs in Vercel dashboard');
    console.log('- Ensure CORS is properly configured');
  }

  process.exit(allPassed ? 0 : 1);
}

// Usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node scripts/test-deployment.js [backend-url] [frontend-url]');
  console.log();
  console.log('Example:');
  console.log('  node scripts/test-deployment.js https://my-api.vercel.app https://my-frontend.vercel.app');
  console.log();
  console.log('If no URLs provided, defaults will be used.');
  process.exit(0);
}

testDeployment().catch(console.error);