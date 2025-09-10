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
  const [userStatsData, setUserStatsData] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading user data for UserStats component...', user._id);
      
      // First, load user stats directly
      const statsResponse = await userAPI.getStats(user._id);
      if (statsResponse.success) {
        console.log('✅ User stats loaded:', statsResponse.stats);
        setUserStatsData(statsResponse.stats);
        
        // Extract frequently wrong questions from user stats
        const frequentlyWrong = statsResponse.stats.frequentlyWrong || [];
        console.log('📝 Frequently wrong questions from stats:', frequentlyWrong.length);
        
        // Convert frequently wrong to priority questions format
        const priorityQuestionsFromStats = frequentlyWrong.map((wrong, index) => ({
          questionId: wrong.questionId,
          exerciseId: wrong.exerciseId,
          category: wrong.category,
          question: wrong.question,
          successRate: 0, // These are wrong answers, so 0% success
          totalAttempts: wrong.count,
          lastAttempt: wrong.lastWrong || wrong.timestamp,
          isWeakPoint: true,
          needsReview: true
        }));
        
        setPriorityQuestions(priorityQuestionsFromStats);
        setWeakPoints(priorityQuestionsFromStats); // Use same data for weak points
        
        // Set answer history from user stats
        setAnswerHistory(statsResponse.stats.answerHistory || []);
      }
      
      // Load performance data
      const performanceResponse = await userAPI.getPerformance(user._id);
      if (performanceResponse.success) {
        console.log('✅ Performance data loaded:', performanceResponse.performance);
        setPerformanceData(performanceResponse.performance);
      } else {
        console.log('⚠️ Performance data load failed, using stats data:', performanceResponse);
        // Fallback to creating performance data from stats
        if (statsResponse.success) {
          const stats = statsResponse.stats;
          const fallbackPerformance = {
            totalQuestions: stats.totalQuestions || 0,
            correctAnswers: stats.correctAnswers || 0,
            successRate: stats.totalQuestions > 0 ? (stats.correctAnswers / stats.totalQuestions) * 100 : 0,
            weakPoints: (stats.frequentlyWrong || []).length,
            needsReview: (stats.frequentlyWrong || []).length,
            categoryBreakdown: stats.categoryStats || {
              reading: { total: 0, correct: 0 },
              listening: { total: 0, correct: 0 },
              clozetext: { total: 0, correct: 0 }
            },
            recentActivity: (stats.answerHistory || []).slice(-10),
            priorityQuestions: priorityQuestionsFromStats
          };
          setPerformanceData(fallbackPerformance);
        }
      }

    } catch (error) {
      console.error('❌ Error loading user data:', error);
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
              {/* Debug info in development */}
              {import.meta.env.DEV && (
                <div className="bg-yellow-50 p-3 rounded border text-xs">
                  <strong>Debug:</strong> Performance data loaded: {JSON.stringify(performanceData, null, 2)}
                </div>
              )}
              
              {/* Overall Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{performanceData.totalQuestions || 0}</div>
                  <div className="text-gray-600">Tổng câu hỏi</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{performanceData.correctAnswers || 0}</div>
                  <div className="text-gray-600">Trả lời đúng</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{(performanceData.successRate || 0).toFixed(1)}%</div>
                  <div className="text-gray-600">Tỷ lệ đúng</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{performanceData.weakPoints || 0}</div>
                  <div className="text-gray-600">Điểm yếu</div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Thống kê theo danh mục</h3>
                <div className="space-y-3">
                  {performanceData.categoryBreakdown && Object.entries(performanceData.categoryBreakdown).map(([category, stats]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(category)}`}>
                          {category === 'reading' ? 'Đọc hiểu' : 
                           category === 'listening' ? 'Nghe hiểu' : 'Điền từ'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {stats.correct || 0}/{stats.total || 0} câu
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {(stats.total || 0) > 0 ? (((stats.correct || 0) / (stats.total || 0)) * 100).toFixed(1) : 0}%
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
                  <div className="text-sm opacity-90">
                    {userStatsData?.frequentlyWrong?.length || 0} câu ưu tiên
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('weak-points')}
                  className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <div className="text-lg font-semibold">Xem điểm yếu</div>
                  <div className="text-sm opacity-90">
                    {userStatsData?.frequentlyWrong?.length || 0} điểm cần cải thiện
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'priority' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Câu hỏi ưu tiên ({userStatsData?.frequentlyWrong?.length || 0})
                </h3>
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

              {/* Debug info in development */}
              {import.meta.env.DEV && userStatsData && (
                <div className="bg-blue-50 p-3 rounded border text-xs">
                  <strong>Debug priority questions:</strong> Using frequentlyWrong data ({userStatsData.frequentlyWrong?.length || 0} items)
                </div>
              )}

              <div className="space-y-3">
                {userStatsData?.frequentlyWrong && userStatsData.frequentlyWrong.length > 0 ? (
                  userStatsData.frequentlyWrong
                    .filter(item => !selectedCategory || item.category === selectedCategory)
                    .slice(0, 10)
                    .map((item, index) => (
                      <div key={`${item.exerciseId || 'unknown'}-${item.questionId || index}`} 
                           className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(item.category)}`}>
                                {item.category === 'reading' ? 'Đọc hiểu' : 
                                 item.category === 'listening' ? 'Nghe hiểu' : 
                                 item.category === 'clozetext' ? 'Điền từ' : item.category || 'Không xác định'}
                              </span>
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                Ưu tiên cao
                              </span>
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Cần ôn tập
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {item.question || `Câu hỏi ID: ${item.questionId}`}
                            </p>
                            <div className="text-xs text-gray-500">
                              Sai: {item.count || 0} lần
                              {item.lastWrong && (
                                <span> • Lần cuối: {formatDate(item.lastWrong)}</span>
                              )}
                              {item.timestamp && !item.lastWrong && (
                                <span> • Lần cuối: {formatDate(item.timestamp)}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">#{index + 1}</div>
                            <div className="text-xs text-gray-500">ưu tiên</div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Chưa có câu hỏi ưu tiên</p>
                    <p className="text-sm mt-2">Làm thêm bài tập để xem các câu hỏi cần ôn tập!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'weak-points' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Phân tích điểm yếu ({userStatsData?.frequentlyWrong?.length || 0})
              </h3>
              
              {/* Debug info in development */}
              {import.meta.env.DEV && userStatsData && (
                <div className="bg-yellow-50 p-3 rounded border text-xs">
                  <strong>Debug frequentlyWrong:</strong> {JSON.stringify(userStatsData.frequentlyWrong, null, 2)}
                </div>
              )}
              
              <div className="space-y-3">
                {userStatsData?.frequentlyWrong && userStatsData.frequentlyWrong.length > 0 ? (
                  userStatsData.frequentlyWrong.slice(0, 15).map((item, index) => (
                    <div key={`${item.exerciseId || 'unknown'}-${item.questionId || index}`} 
                         className="border rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(item.category)}`}>
                              {item.category === 'reading' ? 'Đọc hiểu' : 
                               item.category === 'listening' ? 'Nghe hiểu' : 
                               item.category === 'clozetext' ? 'Điền từ' : item.category || 'Không xác định'}
                            </span>
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Hay sai
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {item.question || `Câu hỏi ID: ${item.questionId}`}
                          </p>
                          <div className="text-xs text-gray-600">
                            Sai: {item.count || 0} lần
                            {item.lastWrong && (
                              <span> • Lần cuối: {formatDate(item.lastWrong)}</span>
                            )}
                            {item.timestamp && !item.lastWrong && (
                              <span> • Lần cuối: {formatDate(item.timestamp)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">{item.count || 0}</div>
                          <div className="text-xs text-gray-500">lần sai</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Chưa có câu nào bị sai nhiều lần</p>
                    <p className="text-sm mt-2">Tiếp tục luyện tập để xem phân tích chi tiết!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Lịch sử làm bài ({userStatsData?.answerHistory?.length || 0})
              </h3>
              
              {/* Debug info in development */}
              {import.meta.env.DEV && userStatsData && (
                <div className="bg-green-50 p-3 rounded border text-xs">
                  <strong>Debug history:</strong> Using answerHistory from userStats ({userStatsData.answerHistory?.length || 0} items)
                </div>
              )}
              
              <div className="space-y-2">
                {userStatsData?.answerHistory && userStatsData.answerHistory.length > 0 ? (
                  userStatsData.answerHistory.slice(0, 20).map((answer, index) => (
                    <div key={`history-${index}`} 
                         className={`border rounded-lg p-3 ${answer.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(answer.category)}`}>
                              {answer.category === 'reading' ? 'Đọc hiểu' : 
                               answer.category === 'listening' ? 'Nghe hiểu' : 
                               answer.category === 'clozetext' ? 'Điền từ' : answer.category || 'Không xác định'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {answer.isCorrect ? 'Đúng' : 'Sai'}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {answer.question || `Câu hỏi ID: ${answer.questionId}`}
                          </p>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Bạn chọn:</span> {answer.selectedAnswer || answer.userAnswer} • 
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Chưa có lịch sử làm bài</p>
                    <p className="text-sm mt-2">Bắt đầu làm bài tập để xem lịch sử!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStats;
