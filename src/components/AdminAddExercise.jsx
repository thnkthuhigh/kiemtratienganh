import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { exerciseAPI } from '../services/api';

function AdminAddExercise() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('reading');
  
  // Form data state
  const [exerciseData, setExerciseData] = useState({
    id: '',
    category: 'reading',
    title: '',
    passage: '',
    audioUrl: '',
    transcript: '',
    questions: [],
    // For clozetext
    question: '',
    options: ['', '', '', ''],
    correct: 'A',
    image: ''
  });

  useEffect(() => {
    if (isEditing) {
      loadExercise();
    }
  }, [id, isEditing]);

  const loadExercise = async () => {
    try {
      setLoading(true);
      // Get all exercises and find the one with matching id
      const allExercises = await exerciseAPI.getAllForAdmin();
      const exercise = allExercises.find(ex => ex.id === id);
      
      if (exercise) {
        setExerciseData(exercise);
        setSelectedCategory(exercise.category);
      } else {
        alert('Không tìm thấy bài tập');
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error loading exercise:', error);
      alert('Có lỗi xảy ra khi tải bài tập');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setExerciseData(prev => ({
      ...prev,
      category,
      // Reset category-specific fields
      title: '',
      passage: '',
      audioUrl: '',
      transcript: '',
      questions: category === 'clozetext' ? [] : [createNewQuestion(category)],
      question: '',
      options: ['', '', '', ''],
      correct: 'A'
    }));
  };

  const createNewQuestion = (category) => {
    const baseQuestion = {
      id: Date.now(),
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correct: 'A'
    };

    if (category === 'listening') {
      return {
        ...baseQuestion,
        type: 'multiple-choice'
      };
    }

    return baseQuestion;
  };

  const addQuestion = () => {
    setExerciseData(prev => ({
      ...prev,
      questions: [...prev.questions, createNewQuestion(selectedCategory)]
    }));
  };

  const updateQuestion = (index, field, value) => {
    setExerciseData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    setExerciseData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          options: q.options.map((opt, j) => j === optionIndex ? value : opt)
        } : q
      )
    }));
  };

  const addBlankToQuestion = (questionIndex) => {
    setExerciseData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          blanks: [...(q.blanks || []), '']
        } : q
      )
    }));
  };

  const updateQuestionBlank = (questionIndex, blankIndex, value) => {
    setExerciseData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          blanks: (q.blanks || []).map((blank, j) => j === blankIndex ? value : blank)
        } : q
      )
    }));
  };

  const removeQuestion = (index) => {
    setExerciseData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Prepare data based on category
      let dataToSubmit = { ...exerciseData };
      
      // For clozetext, ensure we don't send title if it's empty
      if (selectedCategory === 'clozetext') {
        if (!dataToSubmit.title || dataToSubmit.title.trim() === '') {
          delete dataToSubmit.title;
        }
        // Remove fields not needed for clozetext
        delete dataToSubmit.passage;
        delete dataToSubmit.audioUrl;
        delete dataToSubmit.transcript;
        delete dataToSubmit.questions;
      } else {
        // For reading and listening, remove clozetext-specific fields
        delete dataToSubmit.question;
        delete dataToSubmit.options;
        delete dataToSubmit.correct;
        delete dataToSubmit.image;
      }
      
      console.log('📤 Submitting data:', dataToSubmit);
      
      if (isEditing) {
        await exerciseAPI.update(id, dataToSubmit);
        alert('Cập nhật bài tập thành công!');
      } else {
        await exerciseAPI.create(dataToSubmit);
        alert('Thêm bài tập thành công!');
      }
      
      navigate('/admin');
    } catch (error) {
      console.error('Error saving exercise:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi lưu bài tập';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        if (errorData.fields) {
          errorMessage += '\nCác trường lỗi: ' + errorData.fields.join(', ');
        }
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/admin" className="text-indigo-600 hover:text-indigo-800">
            ← Quay lại Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isEditing ? 'Chỉnh Sửa Bài Tập' : 'Thêm Bài Tập Mới'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          {/* Category Selection */}
          {!isEditing && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Chọn Loại Bài Tập
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'reading', label: 'Reading Comprehension', icon: '📖' },
                  { value: 'listening', label: 'Listening', icon: '🎧' },
                  { value: 'clozetext', label: 'Cloze Test', icon: '✏️' }
                ].map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => handleCategoryChange(category.value)}
                    className={`p-4 border-2 rounded-lg text-center transition duration-200 ${
                      selectedCategory === category.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <div className="font-medium">{category.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Bài Tập
              </label>
              <input
                type="text"
                value={exerciseData.id}
                onChange={(e) => setExerciseData(prev => ({ ...prev, id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                placeholder="Ví dụ: reading-1"
              />
            </div>
            
            {selectedCategory !== 'clozetext' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu Đề
                </label>
                <input
                  type="text"
                  value={exerciseData.title}
                  onChange={(e) => setExerciseData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  placeholder="Tiêu đề bài tập"
                  required
                />
              </div>
            )}
          </div>

          {/* Category-specific fields */}
          {selectedCategory === 'reading' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đoạn Văn
              </label>
              <textarea
                value={exerciseData.passage}
                onChange={(e) => setExerciseData(prev => ({ ...prev, passage: e.target.value }))}
                rows="8"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                placeholder="Nhập đoạn văn để đọc hiểu..."
                required
              />
            </div>
          )}

          {selectedCategory === 'listening' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Audio
                </label>
                <input
                  type="url"
                  value={exerciseData.audioUrl}
                  onChange={(e) => setExerciseData(prev => ({ ...prev, audioUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  placeholder="/audio/filename.mp3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transcript
                </label>
                <textarea
                  value={exerciseData.transcript}
                  onChange={(e) => setExerciseData(prev => ({ ...prev, transcript: e.target.value }))}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  placeholder="Nội dung audio..."
                />
              </div>
            </div>
          )}

          {selectedCategory === 'clozetext' && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Câu Hỏi
                </label>
                <input
                  type="text"
                  value={exerciseData.question}
                  onChange={(e) => setExerciseData(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  placeholder="Fill in the blank: I _____ to school every day."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lựa Chọn
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {exerciseData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...exerciseData.options];
                          newOptions[index] = e.target.value;
                          setExerciseData(prev => ({ ...prev, options: newOptions }));
                        }}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                        placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đáp Án Đúng
                </label>
                <select
                  value={exerciseData.correct}
                  onChange={(e) => setExerciseData(prev => ({ ...prev, correct: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>
          )}

          {/* Questions for reading and listening */}
          {(selectedCategory === 'reading' || selectedCategory === 'listening') && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">Câu Hỏi</h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                >
                  + Thêm Câu Hỏi
                </button>
              </div>

              {exerciseData.questions.map((question, qIndex) => (
                <div key={qIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-700">Câu hỏi {qIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Xóa
                    </button>
                  </div>

                  {selectedCategory === 'listening' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại Câu Hỏi
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="fill-blank">Fill in the Blank</option>
                      </select>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Câu Hỏi
                    </label>
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                      placeholder="Nhập câu hỏi..."
                      required
                    />
                  </div>

                  {question.type === 'fill-blank' && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Đáp Án Điền Vào Chỗ Trống
                        </label>
                        <button
                          type="button"
                          onClick={() => addBlankToQuestion(qIndex)}
                          className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          + Thêm Chỗ Trống
                        </button>
                      </div>
                      {(question.blanks || []).map((blank, bIndex) => (
                        <input
                          key={bIndex}
                          type="text"
                          value={blank}
                          onChange={(e) => updateQuestionBlank(qIndex, bIndex, e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:border-indigo-500"
                          placeholder={`Đáp án cho chỗ trống ${bIndex + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {question.type === 'true-false' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đáp Án Đúng
                      </label>
                      <select
                        value={question.correct}
                        onChange={(e) => updateQuestion(qIndex, 'correct', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                        required
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </div>
                  )}

                  {question.type === 'multiple-choice' && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lựa Chọn
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-600">
                                {String.fromCharCode(65 + oIndex)}.
                              </span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)}
                                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                                placeholder={`Lựa chọn ${String.fromCharCode(65 + oIndex)}`}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Đáp Án Đúng
                        </label>
                        <select
                          value={question.correct}
                          onChange={(e) => updateQuestion(qIndex, 'correct', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                          required
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              to="/admin"
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium transition duration-200 disabled:bg-gray-400"
            >
              {loading ? 'Đang lưu...' : (isEditing ? 'Cập Nhật' : 'Thêm Bài Tập')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminAddExercise;
