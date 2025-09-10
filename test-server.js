#!/usr/bin/env node

// Simple test script to verify server functionality
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testServer() {
  console.log('🧪 Testing server functionality...');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test user registration
    console.log('\n2. Testing user registration...');
    const registerData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123'
    };
    
    const registerResponse = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });
    
    const registerResult = await registerResponse.json();
    console.log('✅ Registration:', registerResult.success ? 'SUCCESS' : 'FAILED');
    console.log('User ID:', registerResult.user?._id);
    
    if (registerResult.success) {
      const userId = registerResult.user._id;
      
      // Test stats update
      console.log('\n3. Testing stats update...');
      const testResults = [
        {
          id: 'test-q-1',
          exerciseId: 'test-ex-1',
          category: 'reading',
          type: 'multiple-choice',
          question: 'Test question 1',
          userAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true
        },
        {
          id: 'test-q-2',
          exerciseId: 'test-ex-1',
          category: 'reading',
          type: 'multiple-choice',
          question: 'Test question 2',
          userAnswer: 'B',
          correctAnswer: 'A',
          isCorrect: false
        }
      ];
      
      const timeSpent = {
        'test-ex-1-test-q-1': 15,
        'test-ex-1-test-q-2': 20
      };
      
      const statsResponse = await fetch(`${API_BASE}/users/stats/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: testResults, timeSpent })
      });
      
      const statsResult = await statsResponse.json();
      console.log('✅ Stats update:', statsResult.success ? 'SUCCESS' : 'FAILED');
      
      if (statsResult.success) {
        console.log('📊 Updated stats:');
        console.log('   Total questions:', statsResult.stats.totalQuestions);
        console.log('   Correct answers:', statsResult.stats.correctAnswers);
        console.log('   Answer history length:', statsResult.stats.answerHistory?.length || 0);
      }
      
      // Test getting stats
      console.log('\n4. Testing get stats...');
      const getStatsResponse = await fetch(`${API_BASE}/users/stats/${userId}`);
      const getStatsResult = await getStatsResponse.json();
      console.log('✅ Get stats:', getStatsResult.success ? 'SUCCESS' : 'FAILED');
      
      if (getStatsResult.success) {
        console.log('📊 Retrieved stats:');
        console.log('   Total questions:', getStatsResult.stats.totalQuestions);
        console.log('   Correct answers:', getStatsResult.stats.correctAnswers);
        console.log('   Answer history length:', getStatsResult.stats.answerHistory?.length || 0);
      }
      
      // Test performance endpoint
      console.log('\n5. Testing performance stats...');
      const perfResponse = await fetch(`${API_BASE}/users/performance/${userId}`);
      const perfResult = await perfResponse.json();
      console.log('✅ Performance stats:', perfResult.success ? 'SUCCESS' : 'FAILED');
      
      if (perfResult.success) {
        console.log('📈 Performance data:');
        console.log('   Total questions:', perfResult.performance.totalQuestions);
        console.log('   Success rate:', perfResult.performance.successRate.toFixed(1) + '%');
        console.log('   Weak points:', perfResult.performance.weakPoints);
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testServer();
