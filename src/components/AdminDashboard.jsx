import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { exerciseAPI } from '../services/api';

function AdminDashboard() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const data = await exerciseAPI.getAllForAdmin();
      setExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
      try {
        await exerciseAPI.delete(id);
        loadExercises(); // Reload data
      } catch (error) {
        console.error('Error deleting exercise:', error);
        alert('Có lỗi xảy ra khi xóa bài tập');
      }
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    if (filter === 'all') return true;
    return exercise.category === filter;
  });

  const getExerciseStats = () => {
    const stats = {
      total: exercises.length,
      reading: exercises.filter(e => e.category === 'reading').length,
      listening: exercises.filter(e => e.category === 'listening').length,
      clozetext: exercises.filter(e => e.category === 'clozetext').length,
      active: exercises.filter(e => e.isActive).length,
      inactive: exercises.filter(e => !e.isActive).length
    };
    return stats;
  };

  const stats = getExerciseStats();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Tổng số bài</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.reading}</div>
            <div className="text-sm text-gray-600">Reading</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{stats.listening}</div>
            <div className="text-sm text-gray-600">Listening</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{stats.clozetext}</div>
            <div className="text-sm text-gray-600">Cloze Test</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            <div className="text-sm text-gray-600">Đang hoạt động</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-500">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Đã ẩn</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filter === 'all'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('reading')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filter === 'reading'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📖 Reading
            </button>
            <button
              onClick={() => setFilter('listening')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filter === 'listening'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🎧 Listening
            </button>
            <button
              onClick={() => setFilter('clozetext')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filter === 'clozetext'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ✏️ Cloze Test
            </button>
          </div>
          
          <Link
            to="/admin/add"
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
          >
            + Thêm Bài Tập Mới
          </Link>
        </div>
      </div>

      {/* Exercises List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Danh Sách Bài Tập ({filteredExercises.length})
          </h2>
        </div>
        
        {filteredExercises.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Chưa có bài tập nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bài Tập
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số Câu Hỏi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày Tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExercises.map((exercise) => (
                  <tr key={exercise._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">
                          {exercise.category === 'reading' ? '📖' : 
                           exercise.category === 'listening' ? '🎧' : '✏️'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {exercise.title || exercise.question?.substring(0, 50) + '...'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {exercise.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        exercise.category === 'reading' ? 'bg-green-100 text-green-800' :
                        exercise.category === 'listening' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {exercise.category === 'reading' ? 'Reading' :
                         exercise.category === 'listening' ? 'Listening' : 'Cloze Test'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exercise.questions?.length || 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        exercise.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {exercise.isActive ? 'Hoạt động' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(exercise.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/admin/edit/${exercise.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Sửa
                      </Link>
                      <button
                        onClick={() => handleDelete(exercise.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
