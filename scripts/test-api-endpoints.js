const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Therajai API Endpoints...\n');
  
  const tests = [
    {
      name: 'Homepage',
      url: `${BASE_URL}/`,
      method: 'GET',
      expectedStatus: 200,
      expectContent: 'Therajai'
    },
    {
      name: 'Login Page',
      url: `${BASE_URL}/auth/login`,
      method: 'GET',
      expectedStatus: 200,
      expectContent: 'เข้าสู่ระบบ'
    },
    {
      name: 'Register Page',
      url: `${BASE_URL}/auth/register`,
      method: 'GET',
      expectedStatus: 200,
      expectContent: 'สมัครสมาชิก'
    },
    {
      name: 'Dashboard (should redirect to login)',
      url: `${BASE_URL}/dashboard`,
      method: 'GET',
      expectedStatus: 200,
      expectContent: 'login'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await fetch(test.url, { method: test.method });
      const text = await response.text();
      
      if (response.status === test.expectedStatus) {
        if (text.includes(test.expectContent)) {
          console.log(`✅ ${test.name}: PASSED`);
          passed++;
        } else {
          console.log(`❌ ${test.name}: FAILED - Content not found`);
          failed++;
        }
      } else {
        console.log(`❌ ${test.name}: FAILED - Status ${response.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log(`\n🎉 All tests passed! Your server is working correctly.`);
  } else {
    console.log(`\n🚨 Some tests failed. Check your server configuration.`);
  }
}

// Add registration test
async function testRegistration() {
  console.log('\n🔐 Testing Registration API...');
  
  const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    role: 'CLIENT'
  };

  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration API: PASSED');
      console.log(`   User created: ${data.user.email}`);
    } else {
      console.log('❌ Registration API: FAILED');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Registration API: FAILED');
    console.log(`   Error: ${error.message}`);
  }
}

async function runAllTests() {
  await testAPI();
  await testRegistration();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Test login with: client@therajai.com / client123');
  console.log('3. Follow the complete testing guide in docs/testing-workflows.md');
}

runAllTests();