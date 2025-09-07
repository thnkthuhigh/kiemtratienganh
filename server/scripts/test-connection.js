import mongoose from 'mongoose';

// Test different connection strings
// Replace <PASSWORD> with actual password from MongoDB Atlas
const connectionStrings = [
  'mongodb+srv://thankthuhigh:<PASSWORD>@cluster0.bpqowys.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  'mongodb+srv://thankthuhigh:<PASSWORD>@cluster0.bpqowys.mongodb.net/examenglish?retryWrites=true&w=majority&appName=Cluster0',
  'mongodb+srv://thankthuhigh:<PASSWORD>@cluster0.bpqowys.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0'
];

async function testConnection(uri, index) {
  console.log(`\n🔄 Testing connection ${index + 1}...`);
  console.log(`📍 URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ Connection ${index + 1} successful!`);
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    // Test basic operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections: ${collections.map(c => c.name).join(', ') || 'none'}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Connection ${index + 1} failed: ${error.message}`);
    return false;
  } finally {
    await mongoose.disconnect();
  }
}

async function runTests() {
  console.log('🧪 Testing MongoDB connections...\n');
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const success = await testConnection(connectionStrings[i], i);
    if (success) {
      console.log(`\n🎉 Use this connection string in your .env file:`);
      console.log(`MONGODB_URI=${connectionStrings[i]}`);
      break;
    }
  }
  
  console.log('\n📋 Troubleshooting tips:');
  console.log('1. Check username and password');
  console.log('2. Whitelist your IP address in MongoDB Atlas');
  console.log('3. Ensure the user has proper database permissions');
  console.log('4. Check if the cluster is running');
  
  process.exit(0);
}

runTests();
