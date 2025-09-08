import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  // Chi tiết từng câu trả lời - lưu tất cả câu trả lời (đúng và sai)
  answerHistory: [{
    questionId: String,
    exerciseId: String,
    category: String,
    questionType: String, // 'multiple-choice', 'true-false', 'fill-blank', 'clozetext'
    question: String,
    selectedAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    difficulty: String, // 'easy', 'medium', 'hard'
    timeSpent: Number, // giây
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Thống kê hiệu suất từng câu hỏi
  questionPerformance: [{
    questionId: String,
    exerciseId: String,
    category: String,
    questionType: String,
    question: String,
    totalAttempts: {
      type: Number,
      default: 0
    },
    correctAttempts: {
      type: Number,
      default: 0
    },
    wrongAttempts: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    },
    averageTimeSpent: {
      type: Number,
      default: 0
    },
    lastAttempt: {
      type: Date,
      default: Date.now
    },
    isWeakPoint: {
      type: Boolean,
      default: false
    },
    needsReview: {
      type: Boolean,
      default: false
    }
  }],
  wrongAnswers: [{
    questionId: String,
    exerciseId: String,
    category: String,
    question: String,
    selectedAnswer: String,
    correctAnswer: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  frequentlyWrong: [{
    questionId: String,
    exerciseId: String,
    category: String,
    question: String,
    count: {
      type: Number,
      default: 1
    },
    lastWrong: {
      type: Date,
      default: Date.now
    }
  }],
  categoryStats: {
    reading: {
      total: { type: Number, default: 0 },
      correct: { type: Number, default: 0 }
    },
    listening: {
      total: { type: Number, default: 0 },
      correct: { type: Number, default: 0 }
    },
    clozetext: {
      total: { type: Number, default: 0 },
      correct: { type: Number, default: 0 }
    }
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  stats: {
    type: userStatsSchema,
    default: () => ({
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
    })
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'stats.questionPerformance.questionId': 1 });
userSchema.index({ 'stats.questionPerformance.successRate': 1 });

// Phương thức để cập nhật hiệu suất câu hỏi
userSchema.methods.updateQuestionPerformance = function(questionData, isCorrect, timeSpent = 0) {
  const { questionId, exerciseId, category, questionType, question } = questionData;
  
  // Tìm câu hỏi trong questionPerformance
  let questionPerf = this.stats.questionPerformance.find(
    q => q.questionId === questionId && q.exerciseId === exerciseId
  );
  
  if (!questionPerf) {
    // Tạo mới nếu chưa có
    questionPerf = {
      questionId,
      exerciseId,
      category,
      questionType,
      question,
      totalAttempts: 0,
      correctAttempts: 0,
      wrongAttempts: 0,
      successRate: 0,
      averageTimeSpent: 0,
      lastAttempt: new Date(),
      isWeakPoint: false,
      needsReview: false
    };
    this.stats.questionPerformance.push(questionPerf);
  }
  
  // Cập nhật thống kê
  questionPerf.totalAttempts += 1;
  if (isCorrect) {
    questionPerf.correctAttempts += 1;
  } else {
    questionPerf.wrongAttempts += 1;
  }
  
  // Tính success rate
  questionPerf.successRate = (questionPerf.correctAttempts / questionPerf.totalAttempts) * 100;
  
  // Cập nhật thời gian trung bình
  if (timeSpent > 0) {
    questionPerf.averageTimeSpent = 
      (questionPerf.averageTimeSpent * (questionPerf.totalAttempts - 1) + timeSpent) / questionPerf.totalAttempts;
  }
  
  questionPerf.lastAttempt = new Date();
  
  // Đánh dấu câu hỏi yếu (success rate < 50% và đã làm ít nhất 2 lần)
  questionPerf.isWeakPoint = questionPerf.successRate < 50 && questionPerf.totalAttempts >= 2;
  
  // Đánh dấu cần ôn tập (sai gần đây hoặc chưa làm lâu)
  const daysSinceLastAttempt = (new Date() - questionPerf.lastAttempt) / (1000 * 60 * 60 * 24);
  questionPerf.needsReview = !isCorrect || daysSinceLastAttempt > 7;
  
  return questionPerf;
};

// Phương thức để lấy câu hỏi ưu tiên
userSchema.methods.getPriorityQuestions = function(category = null, limit = 10) {
  let questions = this.stats.questionPerformance;
  
  // Lọc theo category nếu có
  if (category) {
    questions = questions.filter(q => q.category === category);
  }
  
  // Sắp xếp theo độ ưu tiên:
  // 1. Câu hỏi yếu (isWeakPoint = true)
  // 2. Câu hỏi cần ôn tập (needsReview = true)
  // 3. Success rate thấp nhất
  // 4. Lần làm gần đây nhất
  questions.sort((a, b) => {
    // Ưu tiên câu hỏi yếu
    if (a.isWeakPoint && !b.isWeakPoint) return -1;
    if (!a.isWeakPoint && b.isWeakPoint) return 1;
    
    // Ưu tiên câu hỏi cần ôn tập
    if (a.needsReview && !b.needsReview) return -1;
    if (!a.needsReview && b.needsReview) return 1;
    
    // Ưu tiên success rate thấp
    if (a.successRate !== b.successRate) {
      return a.successRate - b.successRate;
    }
    
    // Ưu tiên câu làm gần đây
    return new Date(b.lastAttempt) - new Date(a.lastAttempt);
  });
  
  return questions.slice(0, limit);
};

// Phương thức để lấy thống kê tổng quan
userSchema.methods.getPerformanceStats = function() {
  const stats = this.stats;
  const performance = stats.questionPerformance;
  
  return {
    totalQuestions: stats.totalQuestions,
    correctAnswers: stats.correctAnswers,
    successRate: stats.totalQuestions > 0 ? (stats.correctAnswers / stats.totalQuestions) * 100 : 0,
    weakPoints: performance.filter(q => q.isWeakPoint).length,
    needsReview: performance.filter(q => q.needsReview).length,
    categoryBreakdown: stats.categoryStats,
    recentActivity: stats.answerHistory.slice(-10),
    priorityQuestions: this.getPriorityQuestions(null, 5)
  };
};

export default mongoose.model('User', userSchema);
