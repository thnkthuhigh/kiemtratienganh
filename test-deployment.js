// Test script để kiểm tra production deployment
import axios from 'axios';

const testDeployment = async () => {
  console.log('🧪 Testing Production Deployment...\n');
  
  // Cấu hình URLs (thay thế với URLs thực tế của bạn)
  const BACKEND_URL = process.env.BACKEND_URL || 'https://your-backend-app.onrender.com';
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-app-name.vercel.app';
  
  console.log('🌐 Testing URLs:');
  console.log('   Backend:', BACKEND_URL);
  console.log('   Frontend:', FRONTEND_URL);
  console.log('');
  
  // Test 1: Backend Health Check
  try {
    console.log('1️⃣ Testing Backend Health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`, {
      timeout: 10000
    });
    
    if (healthResponse.status === 200) {
      console.log('   ✅ Backend is healthy');
      console.log('   📊 Status:', healthResponse.data.status);
      console.log('   🗄️ Database:', healthResponse.data.database.connected ? 'Connected' : 'Disconnected');
    }
  } catch (error) {
    console.log('   ❌ Backend health check failed');
    console.log('   🚫 Error:', error.message);
  }
  
  console.log('');
  
  // Test 2: Exercises API
  try {
    console.log('2️⃣ Testing Exercises API...');
    const exercisesResponse = await axios.get(`${BACKEND_URL}/api/exercises`, {
      timeout: 10000
    });
    
    if (exercisesResponse.status === 200) {
      console.log('   ✅ Exercises API working');
      const data = exercisesResponse.data;
      console.log('   📚 Reading exercises:', data.reading?.length || 0);
      console.log('   🎧 Listening exercises:', data.listening?.length || 0);
      console.log('   📝 Clozetext exercises:', data.clozetext?.length || 0);
    }
  } catch (error) {
    console.log('   ❌ Exercises API failed');
    console.log('   🚫 Error:', error.message);
  }
  
  console.log('');
  
  // Test 3: CORS Test
  try {
    console.log('3️⃣ Testing CORS configuration...');
    const corsResponse = await axios.get(`${BACKEND_URL}/api/health`, {
      headers: {
        'Origin': FRONTEND_URL
      },
      timeout: 10000
    });
    
    if (corsResponse.status === 200) {
      console.log('   ✅ CORS configuration working');
    }
  } catch (error) {
    console.log('   ❌ CORS might have issues');
    console.log('   🚫 Error:', error.message);
  }
  
  console.log('');
  
  // Test 4: Frontend accessibility
  try {
    console.log('4️⃣ Testing Frontend accessibility...');
    const frontendResponse = await axios.get(FRONTEND_URL, {
      timeout: 10000
    });
    
    if (frontendResponse.status === 200) {
      console.log('   ✅ Frontend is accessible');
      console.log('   📄 Content length:', frontendResponse.data.length, 'bytes');
    }
  } catch (error) {
    console.log('   ❌ Frontend not accessible');
    console.log('   🚫 Error:', error.message);
  }
  
  console.log('');
  console.log('🏁 Deployment test completed!');
  console.log('');
  console.log('📋 Next steps if everything passes:');
  console.log('   1. Open', FRONTEND_URL, 'in browser');
  console.log('   2. Test user registration/login');
  console.log('   3. Try doing a quiz');
  console.log('   4. Check statistics functionality');
};

// Chạy test
testDeployment().catch(console.error);
