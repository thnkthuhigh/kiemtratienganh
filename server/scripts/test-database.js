import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/database.js';

async function testDatabaseOperations() {
  try {
    console.log('🔍 Testing database operations...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Test creating a user
    const testUsername = `test_${Date.now()}`;
    const testUser = new User({
      username: testUsername,
      email: `${testUsername}@test.com`,
      password: 'testpass123'
    });
    
    await testUser.save();
    console.log('✅ User created successfully:', testUser.username);
    console.log('📊 Initial stats:', testUser.stats);
    
    // Test updating stats
    console.log('\n🔄 Testing stats update...');
    testUser.updateQuestionPerformance({
      questionId: 'test-q-1',
      exerciseId: 'test-ex-1',
      category: 'reading',
      questionType: 'multiple-choice',
      question: 'Test question'
    }, true, 15);
    
    testUser.stats.totalQuestions += 1;
    testUser.stats.correctAnswers += 1;
    testUser.stats.categoryStats.reading.total += 1;
    testUser.stats.categoryStats.reading.correct += 1;
    
    await testUser.save();
    console.log('✅ Stats updated successfully');
    
    // Test getting performance stats
    const perfStats = testUser.getPerformanceStats();
    console.log('📈 Performance stats:', perfStats);
    
    // Test getting priority questions
    const priorityQuestions = testUser.getPriorityQuestions();
    console.log('🎯 Priority questions:', priorityQuestions.length);
    
    // Clean up - remove test user
    await User.findByIdAndDelete(testUser._id);
    console.log('🗑️ Test user cleaned up');
    
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
    process.exit(0);
  }
}

testDatabaseOperations();
