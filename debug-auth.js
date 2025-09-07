// Debug authentication issues with MongoDB Atlas
import mongoose from 'mongoose';

const CLUSTER = 'cluster0.bpqowys.mongodb.net';
const DATABASE = 'examenglish';

// Test different authentication scenarios
const testCases = [
  {
    name: 'Test 1: thankthuhigh (current user)',
    username: 'thankthuhigh',
    password: 'REPLACE_WITH_ACTUAL_PASSWORD', // Thay bằng mật khẩu thực
    note: 'Current user from connection string'
  },
  {
    name: 'Test 2: examenglish (old user)',
    username: 'examenglish',
    password: 'xamenglish',
    note: 'Previous user credentials'
  }
];

async function testAuth(testCase) {
  const uri = `mongodb+srv://${testCase.username}:${testCase.password}@${CLUSTER}/${DATABASE}?retryWrites=true&w=majority&appName=Cluster0`;
  
  console.log(`\n🔄 ${testCase.name}`);
  console.log(`📝 Note: ${testCase.note}`);
  console.log(`👤 User: ${testCase.username}`);
  console.log(`🔗 URI: mongodb+srv://${testCase.username}:***@${CLUSTER}/${DATABASE}`);
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ SUCCESS! Authentication passed');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    // Quick test
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections: ${collections.length} found`);
    
    return true;
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    return false;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

async function runTests() {
  console.log('🧪 MongoDB Authentication Debug\n');
  console.log('⚠️  IMPORTANT: Update passwords in testCases array before running!\n');
  
  let successCount = 0;
  
  for (const testCase of testCases) {
    if (testCase.password.includes('REPLACE') || testCase.password.includes('ACTUAL')) {
      console.log(`\n⏭️  Skipping ${testCase.name} - Please update password`);
      continue;
    }
    
    const success = await testAuth(testCase);
    if (success) {
      successCount++;
      console.log(`\n🎉 Found working credentials: ${testCase.username}`);
      break;
    }
  }
  
  console.log(`\n📊 Results: ${successCount} successful connections`);
  
  if (successCount === 0) {
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. 📝 Update passwords in debug-auth.js');
    console.log('2. 🔐 Check Database Access in MongoDB Atlas');
    console.log('3. 🌐 Verify Network Access (0.0.0.0/0)');
    console.log('4. 👤 Create new database user if needed');
    console.log('5. 🔄 Restart MongoDB cluster');
  } else {
    console.log('\n✅ Use the working credentials in your .env file!');
  }
  
  process.exit(0);
}

runTests();
