import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Vui lòng điền đầy đủ thông tin!' 
      });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ 
        error: 'Tên đăng nhập phải có ít nhất 3 ký tự!' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Mật khẩu phải có ít nhất 6 ký tự!' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ 
          error: 'Tên đăng nhập đã tồn tại!' 
        });
      } else {
        return res.status(400).json({ 
          error: 'Email đã được đăng ký!' 
        });
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password // In production, this should be hashed
    });

    await user.save();

    // Return user data without password
    const { password: _, ...userData } = user.toObject();
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Có lỗi xảy ra khi đăng ký!' 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Vui lòng điền đầy đủ thông tin!' 
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      isActive: true
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ 
        error: 'Tên đăng nhập/email hoặc mật khẩu không đúng!' 
      });
    }

    // Return user data without password
    const { password: _, ...userData } = user.toObject();
    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Có lỗi xảy ra khi đăng nhập!' 
    });
  }
});

// Update user statistics with detailed tracking
router.post('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { results, timeSpent = {} } = req.body;

    console.log('📊 Updating stats for user:', userId, 'with', results.length, 'results');

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    // Ensure user.stats exists and has all required fields
    if (!user.stats) {
      user.stats = {
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
    }

    // Create a safe copy of stats with all required fields
    const newStats = {
      totalQuestions: user.stats.totalQuestions || 0,
      correctAnswers: user.stats.correctAnswers || 0,
      answerHistory: Array.isArray(user.stats.answerHistory) ? [...user.stats.answerHistory] : [],
      questionPerformance: Array.isArray(user.stats.questionPerformance) ? [...user.stats.questionPerformance] : [],
      wrongAnswers: Array.isArray(user.stats.wrongAnswers) ? [...user.stats.wrongAnswers] : [],
      frequentlyWrong: Array.isArray(user.stats.frequentlyWrong) ? [...user.stats.frequentlyWrong] : [],
      categoryStats: {
        reading: { 
          total: user.stats.categoryStats?.reading?.total || 0, 
          correct: user.stats.categoryStats?.reading?.correct || 0 
        },
        listening: { 
          total: user.stats.categoryStats?.listening?.total || 0, 
          correct: user.stats.categoryStats?.listening?.correct || 0 
        },
        clozetext: { 
          total: user.stats.categoryStats?.clozetext?.total || 0, 
          correct: user.stats.categoryStats?.clozetext?.correct || 0 
        }
      }
    };
    
    console.log('📝 Processing', results.length, 'results...');
    
    results.forEach((result, index) => {
      console.log(`📝 Processing result ${index + 1}:`, {
        id: result.id,
        category: result.category,
        isCorrect: result.isCorrect
      });
      
      newStats.totalQuestions++;
      
      // Lấy thời gian làm bài cho câu hỏi này
      const questionTime = timeSpent[`${result.exerciseId}-${result.id}`] || 0;
      
      // Thêm vào lịch sử trả lời
      newStats.answerHistory.push({
        questionId: result.id,
        exerciseId: result.exerciseId,
        category: result.category,
        questionType: result.type,
        question: result.question,
        selectedAnswer: result.userAnswer,
        correctAnswer: result.correctAnswer,
        isCorrect: result.isCorrect,
        timeSpent: questionTime,
        timestamp: new Date()
      });
      
      // Cập nhật hiệu suất câu hỏi sử dụng method từ schema
      user.updateQuestionPerformance({
        questionId: result.id,
        exerciseId: result.exerciseId,
        category: result.category,
        questionType: result.type,
        question: result.question
      }, result.isCorrect, questionTime);
      
      // Update category stats - ensure category exists
      if (!newStats.categoryStats[result.category]) {
        newStats.categoryStats[result.category] = { total: 0, correct: 0 };
      }
      
      newStats.categoryStats[result.category].total++;
      
      if (result.isCorrect) {
        newStats.correctAnswers++;
        newStats.categoryStats[result.category].correct++;
        console.log(`✅ Correct answer for question ${result.id}`);
      } else {
        // Add to wrong answers
        newStats.wrongAnswers.push({
          questionId: result.id,
          exerciseId: result.exerciseId,
          category: result.category,
          question: result.question,
          selectedAnswer: result.userAnswer,
          correctAnswer: result.correctAnswer,
          timestamp: new Date()
        });

        // Update frequently wrong
        const existingWrong = newStats.frequentlyWrong.find(
          w => w.questionId === result.id
        );
        
        if (existingWrong) {
          existingWrong.count++;
          existingWrong.lastWrong = new Date();
        } else {
          newStats.frequentlyWrong.push({
            questionId: result.id,
            exerciseId: result.exerciseId,
            category: result.category,
            question: result.question,
            count: 1,
            lastWrong: new Date()
          });
        }
        console.log(`❌ Wrong answer for question ${result.id}`);
      }
    });

    // Giới hạn lịch sử trả lời (chỉ giữ 1000 câu gần nhất)
    if (newStats.answerHistory.length > 1000) {
      newStats.answerHistory = newStats.answerHistory.slice(-1000);
    }

    // Sort frequently wrong by count
    newStats.frequentlyWrong.sort((a, b) => b.count - a.count);

    // Update user with the new stats
    user.stats = newStats;
    await user.save();
    
    console.log('✅ Stats updated successfully for user:', userId);
    console.log('📊 New stats summary:', {
      totalQuestions: newStats.totalQuestions,
      correctAnswers: newStats.correctAnswers,
      answerHistoryLength: newStats.answerHistory.length,
      questionPerformanceLength: newStats.questionPerformance.length
    });

    res.json({
      success: true,
      message: 'Cập nhật thống kê thành công!',
      stats: newStats
    });

  } catch (error) {
    console.error('❌ Update stats error:', error);
    res.status(500).json({ 
      error: 'Có lỗi xảy ra khi cập nhật thống kê!',
      details: error.message
    });
  }
});

// Get user statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    res.json({
      success: true,
      stats: user.stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Có lỗi xảy ra khi lấy thống kê!' 
    });
  }
});

// Get priority questions for practice
router.get('/priority-questions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, limit = 10 } = req.query;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    const priorityQuestions = user.getPriorityQuestions(category, parseInt(limit));

    res.json({
      success: true,
      priorityQuestions,
      totalWeakPoints: user.stats.questionPerformance.filter(q => q.isWeakPoint).length,
      totalNeedsReview: user.stats.questionPerformance.filter(q => q.needsReview).length
    });

  } catch (error) {
    console.error('Get priority questions error:', error);
    res.status(500).json({ 
      error: 'Có lỗi xảy ra khi lấy câu hỏi ưu tiên!' 
    });
  }
});

// Get detailed performance stats
router.get('/performance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    const performanceStats = user.getPerformanceStats();

    res.json({
      success: true,
      performance: performanceStats
    });

  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ 
      error: 'Có lỗi xảy ra khi lấy thống kê hiệu suất!' 
    });
  }
});

// Get answer history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, limit = 50, page = 1 } = req.query;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    // Ensure answerHistory exists
    let history = user.stats?.answerHistory || [];
    
    // Lọc theo category nếu có
    if (category) {
      history = history.filter(h => h.category === category);
    }
    
    // Sắp xếp theo thời gian (mới nhất trước)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Phân trang
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = history.slice(startIndex, endIndex);

    res.json({
      success: true,
      history: paginatedHistory,
      totalCount: history.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(history.length / limit)
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      error: 'Có lỗi xảy ra khi lấy lịch sử trả lời!' 
    });
  }
});

// Get weak points analysis
router.get('/weak-points/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category } = req.query;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    // Ensure questionPerformance exists
    const questionPerformance = user.stats?.questionPerformance || [];
    
    let weakPoints = questionPerformance.filter(q => q.isWeakPoint);
    
    // Lọc theo category nếu có
    if (category) {
      weakPoints = weakPoints.filter(q => q.category === category);
    }
    
    // Sắp xếp theo success rate thấp nhất
    weakPoints.sort((a, b) => a.successRate - b.successRate);

    // Phân tích theo loại câu hỏi
    const analysisByType = {};
    weakPoints.forEach(q => {
      if (!analysisByType[q.questionType]) {
        analysisByType[q.questionType] = {
          count: 0,
          avgSuccessRate: 0,
          questions: []
        };
      }
      analysisByType[q.questionType].count++;
      analysisByType[q.questionType].questions.push(q);
    });
    
    // Tính success rate trung bình cho từng loại
    Object.keys(analysisByType).forEach(type => {
      const questions = analysisByType[type].questions;
      analysisByType[type].avgSuccessRate = 
        questions.reduce((sum, q) => sum + (q.successRate || 0), 0) / questions.length;
    });

    res.json({
      success: true,
      weakPoints,
      analysisByType,
      totalWeakPoints: weakPoints.length
    });

  } catch (error) {
    console.error('Get weak points error:', error);
    res.status(500).json({ 
      error: 'Có lỗi xảy ra khi phân tích điểm yếu!' 
    });
  }
});

export default router;
