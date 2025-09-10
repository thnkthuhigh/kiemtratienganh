import React, { useState } from 'react';
import { userAPI } from '../services/api.js';

const DebugStats = ({ user, userStats, onRefreshStats }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRefreshStats = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      console.log('🔄 Refreshing stats for user:', user._id);
      const response = await userAPI.getStats(user._id);
      if (response.success) {
        console.log('✅ Fresh stats loaded:', response.stats);
        onRefreshStats(response.stats);
      }
    } catch (error) {
      console.error('❌ Error refreshing stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearStats = async () => {
    if (!user?._id) return;
    
    if (!confirm('Bạn có chắc muốn xóa tất cả thống kê?')) return;
    
    try {
      console.log('🗑️ Clearing stats for user:', user._id);
      
      // Clear stats by sending empty results array
      const response = await userAPI.updateStats(user._id, []);
      
      if (response.success) {
        console.log('✅ Stats cleared successfully');
        onRefreshStats(response.stats);
      } else {
        console.error('❌ Failed to clear stats:', response);
      }
      
    } catch (error) {
      console.error('❌ Error clearing stats:', error);
    }
  };

  const handleTestStatsUpdate = async () => {
    if (!user?._id) return;
    
    try {
      console.log('🧪 Testing stats update...');
      
      // Create test results
      const testResults = [
        {
          id: `test-q-${Date.now()}-1`,
          exerciseId: `test-ex-${Date.now()}`,
          category: 'reading',
          type: 'multiple-choice',
          question: 'Test question 1 - This is correct',
          userAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true
        },
        {
          id: `test-q-${Date.now()}-2`,
          exerciseId: `test-ex-${Date.now()}`,
          category: 'listening',
          type: 'true-false',
          question: 'Test question 2 - This is wrong',
          userAnswer: 'false',
          correctAnswer: 'true',
          isCorrect: false
        }
      ];
      
      const timeSpent = {};
      testResults.forEach(result => {
        timeSpent[`${result.exerciseId}-${result.id}`] = Math.floor(Math.random() * 30) + 10;
      });
      
      const response = await userAPI.updateStats(user._id, testResults, timeSpent);
      
      if (response.success) {
        console.log('✅ Test stats update successful:', response.stats);
        onRefreshStats(response.stats);
      } else {
        console.error('❌ Test stats update failed:', response);
      }
      
    } catch (error) {
      console.error('❌ Error testing stats update:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-yellow-800">
          🔍 Debug Panel (Development)
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-yellow-600 hover:text-yellow-800 text-sm"
        >
          {isExpanded ? 'Thu gọn' : 'Mở rộng'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <strong>User ID:</strong> {user._id || user.id}
            </div>
            <div>
              <strong>Username:</strong> {user.username}
            </div>
          </div>

          {/* Current Stats */}
          <div className="bg-white p-3 rounded border">
            <h4 className="font-medium text-gray-800 mb-2">Current Stats:</h4>
            <div className="text-xs space-y-1">
              <div>Total Questions: {userStats?.totalQuestions || 0}</div>
              <div>Correct Answers: {userStats?.correctAnswers || 0}</div>
              <div>Wrong Answers: {userStats?.wrongAnswers?.length || 0}</div>
              <div>Question Performance: {userStats?.questionPerformance?.length || 0}</div>
              <div>Answer History: {userStats?.answerHistory?.length || 0}</div>
            </div>
          </div>

          {/* Category Stats */}
          {userStats?.categoryStats && (
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-gray-800 mb-2">Category Stats:</h4>
              <div className="text-xs space-y-1">
                {Object.entries(userStats.categoryStats).map(([category, stats]) => (
                  <div key={category}>
                    {category}: {stats.correct}/{stats.total} 
                    ({stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0}%)
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefreshStats}
              disabled={loading}
              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Refresh Stats'}
            </button>
            <button
              onClick={handleTestStatsUpdate}
              className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
            >
              Test Stats Update
            </button>
            <button
              onClick={handleClearStats}
              className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
            >
              Clear Stats
            </button>
            <button
              onClick={() => {
                console.log('👤 Current User:', user);
                console.log('📊 Current Stats:', userStats);
                console.log('💾 LocalStorage User:', localStorage.getItem('quizUser'));
                console.log('💾 LocalStorage Stats:', localStorage.getItem(`userStats_${user.id}`));
              }}
              className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
            >
              Log Debug Info
            </button>
          </div>

          {/* Server Status */}
          <div className="text-xs text-gray-600">
            <div>API URL: {import.meta.env.VITE_API_URL || 'Default Local'}</div>
            <div>Environment: {import.meta.env.MODE}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugStats;
