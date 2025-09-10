import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/database.js';

async function migrateUserStats() {
  try {
    console.log('🔧 Starting user stats migration...');
    
    // Connect to database
    await connectDB();
    
    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to migrate`);
    
    let migratedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      
      // Ensure stats object exists
      if (!user.stats) {
        user.stats = {};
        needsUpdate = true;
      }
      
      // Ensure all required fields exist
      const defaultStats = {
        totalQuestions: 0,
        correctAnswers: 0,
        answerHistory: [],
        questionPerformance: [],
        wrongAnswers: [],
        frequentlyWrong: [],
        categoryStats: {
          reading: { total: 0, correct: 0 },
          listening: { total: 0, correct: 0 },
          clozetext: { total: 0, correct: 0 }
        }
      };
      
      for (const [key, defaultValue] of Object.entries(defaultStats)) {
        if (user.stats[key] === undefined || user.stats[key] === null) {
          user.stats[key] = defaultValue;
          needsUpdate = true;
        }
      }
      
      // Ensure categoryStats has all categories
      if (!user.stats.categoryStats) {
        user.stats.categoryStats = defaultStats.categoryStats;
        needsUpdate = true;
      } else {
        for (const [category, defaultCatStats] of Object.entries(defaultStats.categoryStats)) {
          if (!user.stats.categoryStats[category]) {
            user.stats.categoryStats[category] = defaultCatStats;
            needsUpdate = true;
          } else {
            // Ensure total and correct exist
            if (user.stats.categoryStats[category].total === undefined) {
              user.stats.categoryStats[category].total = 0;
              needsUpdate = true;
            }
            if (user.stats.categoryStats[category].correct === undefined) {
              user.stats.categoryStats[category].correct = 0;
              needsUpdate = true;
            }
          }
        }
      }
      
      // Ensure arrays are actually arrays
      const arrayFields = ['answerHistory', 'questionPerformance', 'wrongAnswers', 'frequentlyWrong'];
      for (const field of arrayFields) {
        if (!Array.isArray(user.stats[field])) {
          user.stats[field] = [];
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        console.log(`📝 Migrating user: ${user.username}`);
        await user.save();
        migratedCount++;
      }
    }
    
    console.log(`✅ Migration completed! ${migratedCount} users updated.`);
    
    // Test a user's performance stats
    if (users.length > 0) {
      const testUser = users[0];
      console.log('\n🧪 Testing performance stats for user:', testUser.username);
      const perfStats = testUser.getPerformanceStats();
      console.log('📊 Performance stats:', perfStats);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrateUserStats();
