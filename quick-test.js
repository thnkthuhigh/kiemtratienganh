// Quick MongoDB connection test
// Thay YOUR_PASSWORD bằng mật khẩu thực tế và chạy: node quick-test.js

import mongoose from 'mongoose';

// THAY ĐỔI PASSWORD TẠI ĐÂY
const PASSWORD = 'YOUR_PASSWORD'; // <-- Thay bằng mật khẩu thực tế
const USERNAME = 'thankthuhigh';
const CLUSTER = 'cluster0.bpqowys.mongodb.net';
const DATABASE = 'examenglish';

const MONGODB_URI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${DATABASE}?retryWrites=true&w=majority&appName=Cluster0`;

console.log('🔄 Testing MongoDB connection...');
console.log('👤 Username:', USERNAME);
console.log('🌐 Cluster:', CLUSTER);
console.log('💾 Database:', DATABASE);
console.log('📍 Full URI:', MONGODB_URI.replace(/:([^@]+)@/, ':***@'));

async function testConnection() {
  try {
    console.log('\n⏳ Connecting...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ CONNECTION SUCCESSFUL!');
    console.log('📊 Connected to database:', mongoose.connection.db.databaseName);
    
    // Test basic operations
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    console.log('🚀 MongoDB version:', serverStatus.version);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name).join(', ') || 'none');
    
    console.log('\n🎉 Database is ready to use!');
    
  } catch (error) {
    console.log('\n❌ CONNECTION FAILED!');
    console.log('📝 Error:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n🔐 AUTHENTICATION ERROR:');
      console.log('1. ❌ Username or password is incorrect');
      console.log('2. ❌ User does not exist in MongoDB Atlas');
      console.log('3. ❌ User does not have permissions');
      console.log('\n💡 SOLUTIONS:');
      console.log('• Check Database Access in MongoDB Atlas');
      console.log('• Verify username and password');
      console.log('• Create new database user with admin rights');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🌐 NETWORK ERROR:');
      console.log('1. ❌ Check internet connection');
      console.log('2. ❌ Cluster URL might be wrong');
      console.log('3. ❌ Firewall blocking connection');
    }
    
    if (error.message.includes('IP not in whitelist')) {
      console.log('\n🔒 IP WHITELIST ERROR:');
      console.log('• Add 0.0.0.0/0 to Network Access in MongoDB Atlas');
      console.log('• Or add your current IP address');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Kiểm tra xem đã thay password chưa
if (PASSWORD === 'YOUR_PASSWORD') {
  console.log('❌ PLEASE UPDATE THE PASSWORD!');
  console.log('📝 Edit this file and change PASSWORD variable');
  console.log('💡 Then run: node quick-test.js');
  process.exit(1);
}

testConnection();
