import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api.js';

const UserStats = ({ user, onClose, onPriorityQuiz }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [priorityQuestions, setPriorityQuestions] = useState([]);
  const [weakPoints, setWeakPoints] = useState([]);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load performance data
      const performanceResponse = await userAPI.getPerformance(user._id);
      if (performanceResponse.success) {
        setPerformanceData(performanceResponse.performance);
      }

      // Load priority questions
      const priorityResponse = await userAPI.getPriorityQuestions(user._id, null, 20);
      if (priorityResponse.success) {
        setPriorityQuestions(priorityResponse.priorityQuestions);
      }

      // Load weak points
      const weakPointsResponse = await userAPI.getWeakPoints(user._id);
      if (weakPointsResponse.success) {
        setWeakPoints(weakPointsResponse.weakPoints);
      }

      // Load recent history
      const historyResponse = await userAPI.getHistory(user._id, null, 20);
      if (historyResponse.success) {
        setAnswerHistory(historyResponse.history);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      reading: 'bg-blue-100 text-blue-800',
      listening: 'bg-green-100 text-green-800',
      clozetext: 'bg-purple-100 text-purple-800',
      mixed: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleStartPriorityQuiz = (category = null) => {
    onPriorityQuiz(category, priorityQuestions.filter(q => !category || q.category === category));
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải thống kê...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Thống kê học tập</h2>
              <p className="opacity-90">Chào {user.username}!</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Tổng quan' },
              { id: 'priority', label: 'Câu hỏi ưu tiên' },
              { id: 'weak-points', label: 'Điểm yếu' },
              { id: 'history', label: 'Lịch sử' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && performanceData && (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{performanceData.totalQuestions}</div>
                  <div className="text-gray-600">Tổng câu hỏi</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{performanceData.correctAnswers}</div>
                  <div className="text-gray-600">Trả lời đúng</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{performanceData.successRate.toFixed(1)}%</div>
                  <div className="text-gray-600">Tỷ lệ đúng</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{performanceData.weakPoints}</div>
                  <div className="text-gray-600">Điểm yếu</div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Thống kê theo danh mục</h3>
                <div className="space-y-3">
                  {Object.entries(performanceData.categoryBreakdown).map(([category, stats]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(category)}`}>
                          {category === 'reading' ? 'Đọc hiểu' : 
                           category === 'listening' ? 'Nghe hiểu' : 'Điền từ'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {stats.correct}/{stats.total} câu
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleStartPriorityQuiz()}
                  className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <div className="text-lg font-semibold">Luyện tập điểm yếu</div>
                  <div className="text-sm opacity-90">{performanceData.priorityQuestions.length} câu ưu tiên</div>
                </button>
                <button
                  onClick={() => setActiveTab('weak-points')}
                  className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <div className="text-lg font-semibold">Xem điểm yếu</div>
                  <div className="text-sm opacity-90">{performanceData.weakPoints} điểm cần cải thiện</div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'priority' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Câu hỏi ưu tiên ({priorityQuestions.length})</h3>
                <div className="flex space-x-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="">Tất cả danh mục</option>
                    <option value="reading">Đọc hiểu</option>
                    <option value="listening">Nghe hiểu</option>
                    <option value="clozetext">Điền từ</option>
                  </select>
                  <button
                    onClick={() => handleStartPriorityQuiz(selectedCategory || null)}
                    className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Luyện tập
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {priorityQuestions
                  .filter(q => !selectedCategory || q.category === selectedCategory)
                  .slice(0, 10)
                  .map((question, index) => (
                    <div key={`${question.exerciseId}-${question.questionId}`} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(question.category)}`}>
                              {question.category === 'reading' ? 'Đọc hiểu' : 
                               question.category === 'listening' ? 'Nghe hiểu' : 'Điền từ'}
                            </span>
                            {question.isWeakPoint && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                Điểm yếu
                              </span>
                            )}
                            {question.needsReview && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Cần ôn tập
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{question.question}</p>
                          <div className="text-xs text-gray-500">
                            Tỷ lệ đúng: {question.successRate.toFixed(1)}% • 
                            Lần làm: {question.totalAttempts} • 
                            Lần cuối: {formatDate(question.lastAttempt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">#{index + 1}</div>
                          <div className="text-xs text-gray-500">ưu tiên</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'weak-points' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Phân tích điểm yếu ({weakPoints.length})</h3>
              
              <div className="space-y-3">
                {weakPoints.slice(0, 15).map((question, index) => (
                  <div key={`${question.exerciseId}-${question.questionId}`} className="border rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(question.category)}`}>
                            {question.category === 'reading' ? 'Đọc hiểu' : 
                             question.category === 'listening' ? 'Nghe hiểu' : 'Điền từ'}
                          </span>
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            {question.questionType}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{question.question}</p>
                        <div className="text-xs text-gray-600">
                          Đúng: {question.correctAttempts}/{question.totalAttempts} lần • 
                          Tỷ lệ: {question.successRate.toFixed(1)}% • 
                          Lần cuối: {formatDate(question.lastAttempt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">{question.successRate.toFixed(0)}%</div>
                        <div className="text-xs text-gray-500">tỷ lệ đúng</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lịch sử làm bài ({answerHistory.length})</h3>
              
              <div className="space-y-2">
                {answerHistory.slice(0, 20).map((answer, index) => (
                  <div key={index} className={`border rounded-lg p-3 ${answer.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(answer.category)}`}>
                            {answer.category === 'reading' ? 'Đọc hiểu' : 
                             answer.category === 'listening' ? 'Nghe hiểu' : 'Điền từ'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {answer.isCorrect ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{answer.question}</p>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Bạn chọn:</span> {answer.selectedAnswer} • 
                          <span className="font-medium"> Đáp án:</span> {answer.correctAnswer}
                          {answer.timeSpent > 0 && (
                            <span> • <span className="font-medium">Thời gian:</span> {answer.timeSpent}s</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(answer.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStats;
