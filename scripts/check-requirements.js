const { exec } = require('child_process');
const fs = require('fs');

console.log('🔍 Checking Therajai Requirements...\n');

// Check Node.js version
const nodeVersion = process.version;
const requiredNodeVersion = '18.17.0';
console.log(`📦 Node.js Version: ${nodeVersion}`);

function compareVersions(version1, version2) {
  const v1parts = version1.replace('v', '').split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }
  return 0;
}

const nodeVersionOk = compareVersions(nodeVersion, requiredNodeVersion) >= 0;
console.log(`   ${nodeVersionOk ? '✅' : '❌'} Node.js ${nodeVersionOk ? 'meets' : 'does not meet'} minimum requirement (>= ${requiredNodeVersion})`);

// Check PostgreSQL
exec('psql --version', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ PostgreSQL: Not found or not in PATH');
  } else {
    console.log(`✅ PostgreSQL: ${stdout.trim()}`);
  }
  
  // Check if PostgreSQL service is running
  exec('brew services list | grep postgres', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ PostgreSQL Service: Cannot check status');
    } else {
      const isRunning = stdout.includes('started');
      console.log(`   ${isRunning ? '✅' : '❌'} PostgreSQL Service: ${isRunning ? 'Running' : 'Not running'}`);
      if (!isRunning) {
        console.log('   💡 Start with: brew services start postgresql@14');
      }
    }
  });
});

// Check npm
exec('npm --version', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ npm: Not found');
  } else {
    console.log(`✅ npm: ${stdout.trim()}`);
  }
});

// Check if dependencies are installed
const nodeModulesExists = fs.existsSync('./node_modules');
console.log(`${nodeModulesExists ? '✅' : '❌'} Dependencies: ${nodeModulesExists ? 'Installed' : 'Not installed'}`);
if (!nodeModulesExists) {
  console.log('   💡 Install with: npm install');
}

// Check environment file
const envExists = fs.existsSync('./.env');
console.log(`${envExists ? '✅' : '❌'} Environment file: ${envExists ? 'Found' : 'Missing'}`);
if (!envExists) {
  console.log('   💡 Copy from: cp .env.example .env');
}

// Check database connection
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('✅ Database connection: Working');
    return prisma.user.count();
  })
  .then((count) => {
    console.log(`✅ Database data: ${count} users found`);
  })
  .catch((error) => {
    console.log('❌ Database connection: Failed');
    console.log('   💡 Check if PostgreSQL is running and .env is configured');
  })
  .finally(() => {
    prisma.$disconnect();
    
    setTimeout(() => {
      console.log('\n🎯 Summary:');
      if (!nodeVersionOk) {
        console.log('❌ Node.js version needs to be updated');
        console.log('   Run: brew install node');
      } else {
        console.log('✅ All requirements look good!');
        console.log('\n🚀 Ready to run:');
        console.log('   npm run dev');
        console.log('\n🌐 Then visit: http://localhost:3000');
      }
    }, 1000);
  });