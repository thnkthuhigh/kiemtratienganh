// Script để tạo file .env
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Tạo file .env cho MongoDB connection\n');

rl.question('Nhập mật khẩu MongoDB cho user "thankthuhigh": ', (password) => {
  if (!password.trim()) {
    console.log('❌ Mật khẩu không được để trống!');
    rl.close();
    return;
  }

  const envContent = `MONGODB_URI=mongodb+srv://thankthuhigh:${password}@cluster0.bpqowys.mongodb.net/examenglish?retryWrites=true&w=majority&appName=Cluster0
PORT=5000
NODE_ENV=development`;

  try {
    fs.writeFileSync('.env', envContent);
    console.log('✅ File .env đã được tạo thành công!');
    console.log('📄 Nội dung:');
    console.log('   MONGODB_URI=mongodb+srv://thankthuhigh:***@cluster0.bpqowys.mongodb.net/examenglish...');
    console.log('   PORT=5000');
    console.log('   NODE_ENV=development');
    console.log('\n🚀 Bây giờ bạn có thể chạy: npm run server');
  } catch (error) {
    console.log('❌ Lỗi tạo file .env:', error.message);
  }

  rl.close();
});
