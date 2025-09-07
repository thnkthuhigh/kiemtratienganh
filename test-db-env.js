// Quick test script for MongoDB connection
// Usage: MONGODB_URI="your-full-connection-string" node test-db-env.js

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.log('❌ Please provide MONGODB_URI environment variable');
  console.log('Example:');
  console.log('MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/db" node test-db-env.js');
  process.exit(1);
}

console.log('🔄 Testing MongoDB connection...');
console.log('📍 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

try {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  
  console.log('✅ Connection successful!');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('📁 Collections:', collections.map(c => c.name).join(', ') || 'none');
  
} catch (error) {
  console.log('❌ Connection failed:', error.message);
  
  if (error.message.includes('Authentication failed')) {
    console.log('\n🔐 Authentication Error - Check:');
    console.log('1. Username and password are correct');
    console.log('2. User exists in Database Access');
    console.log('3. User has proper permissions');
  }
  
  if (error.message.includes('ENOTFOUND')) {
    console.log('\n🌐 Network Error - Check:');
    console.log('1. Internet connection');
    console.log('2. Cluster URL is correct');
    console.log('3. Cluster is running');
  }
} finally {
  await mongoose.disconnect();
  process.exit(0);
}
