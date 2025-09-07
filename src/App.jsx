import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { exerciseAPI } from './services/api.js';
import AdminDashboard from './components/AdminDashboard';
import AdminAddExercise from './components/AdminAddExercise';

function QuizApp() {
  const [questionsData, setQuestionsData] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentExercise, setCurrentExercise] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [fillBlankAnswers, setFillBlankAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [numberOfExercises, setNumberOfExercises] = useState(2);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  // Load questions from API
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await exerciseAPI.getAll();
        setQuestionsData(data);
      } catch (error) {
        console.error('Error loading exercises:', error);
        // Fallback to empty data
        setQuestionsData({
          reading: [],
          listening: [],
          clozetext: []
        });
      }
    };
    
    loadExercises();
  }, []);

  // Start quiz with selected category and number of exercises
  const startQuiz = (category) => {
    if (!questionsData || !questionsData[category]) return;
    
    const categoryData = questionsData[category];
    let selectedExercises;
    
    if (category === 'clozetext') {
      // For clozetext, keep the old individual question format
      const shuffled = [...categoryData].sort(() => 0.5 - Math.random());
      selectedExercises = shuffled.slice(0, Math.min(numberOfExercises * 3, categoryData.length));
    } else {
      // For reading and listening, select complete exercises
      const shuffled = [...categoryData].sort(() => 0.5 - Math.random());
      selectedExercises = shuffled.slice(0, Math.min(numberOfExercises, categoryData.length));
    }
    
    setCurrentCategory(category);
    setCurrentExercise(selectedExercises);
    setScore(0);
    setQuizStarted(true);
    setSelectedAnswers({});
    setFillBlankAnswers({});
    setShowResult(false);
    
    // Calculate total questions
    if (category === 'clozetext') {
      setTotalQuestions(selectedExercises.length);
    } else {
      const total = selectedExercises.reduce((sum, exercise) => sum + exercise.questions.length, 0);
      setTotalQuestions(total);
    }
  };

  // Handle answer selection for multiple choice and true/false
  const handleAnswerSelect = (exerciseId, questionId, answer) => {
    const key = `${exerciseId}-${questionId}`;
    setSelectedAnswers(prev => ({
      ...prev,
      [key]: answer
    }));
  };

  // Handle fill in the blank answers
  const handleFillBlankChange = (exerciseId, questionId, blankIndex, value) => {
    const key = `${exerciseId}-${questionId}-${blankIndex}`;
    setFillBlankAnswers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Calculate score and submit quiz
  const submitQuiz = () => {
    let correctAnswers = 0;
    
    if (currentCategory === 'clozetext') {
      // Handle clozetext scoring
      currentExercise.forEach((question) => {
        const key = `${question.id}`;
        if (selectedAnswers[key] === question.correct) {
          correctAnswers++;
        }
      });
    } else {
      // Handle reading and listening scoring
      currentExercise.forEach((exercise) => {
        exercise.questions.forEach((question) => {
          const key = `${exercise.id}-${question.id}`;
          
          if (question.type === 'fill-blank') {
            let isCorrect = true;
            question.blanks.forEach((correctAnswer, index) => {
              const blankKey = `${exercise.id}-${question.id}-${index}`;
              const userAnswer = fillBlankAnswers[blankKey]?.toLowerCase().trim();
              if (userAnswer !== correctAnswer.toLowerCase()) {
                isCorrect = false;
              }
            });
            if (isCorrect) correctAnswers++;
          } else if (question.type === 'true-false') {
            if (selectedAnswers[key] === question.correct) {
              correctAnswers++;
            }
          } else if (question.type === 'multiple-choice') {
            if (selectedAnswers[key] === question.correct) {
              correctAnswers++;
            }
          }
        });
      });
    }
    
    setScore(correctAnswers);
    setShowResult(true);
  };

  // Reset quiz
  const resetQuiz = () => {
    setQuizStarted(false);
    setShowResult(false);
    setSelectedAnswers({});
    setFillBlankAnswers({});
    setScore(0);
    setCurrentExercise(null);
  };

  // Audio controls
  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsAudioPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  };

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
    }
  };

  // Get option letter (A, B, C, D)
  const getOptionLetter = (index) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  if (!questionsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  // Show final results
  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Kết Quả Kiểm Tra</h2>
            
            <div className="mb-6">
              <div className="text-6xl mb-4">
                {score === totalQuestions ? '🎉' : score >= totalQuestions * 0.7 ? '😊' : '😔'}
              </div>
              <p className="text-2xl font-semibold text-indigo-600">
                {score}/{totalQuestions}
              </p>
              <p className="text-lg text-gray-600 mt-2">
                Tỷ lệ đúng: {Math.round((score / totalQuestions) * 100)}%
              </p>
            </div>

            <div className="mb-6">
              <p className="text-lg text-gray-700">
                {score === totalQuestions ? 'Xuất sắc! Bạn đã trả lời đúng tất cả câu hỏi!' :
                 score >= totalQuestions * 0.7 ? 'Tốt lắm! Bạn đã làm rất tốt!' :
                 'Hãy cố gắng luyện tập thêm nhé!'}
              </p>
            </div>

            <button
              onClick={resetQuiz}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
            >
              Làm Bài Mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz interface
  if (quizStarted && currentExercise && currentExercise.length > 0) {
    if (currentCategory === 'clozetext') {
      // Render clozetext with individual questions (old format)
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                  CLOZE TEST
                </span>
                <span className="text-gray-500">
                  {totalQuestions} câu hỏi
                </span>
              </div>

              <div className="space-y-8">
                {currentExercise.map((question, qIndex) => {
                  const key = `${question.id}`;
                  const selectedAnswer = selectedAnswers[key];

                  return (
                    <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {qIndex + 1}. {question.question}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {question.options.map((option, index) => {
                          const optionLetter = getOptionLetter(index);
                          const isSelected = selectedAnswer === optionLetter;
                          
                          return (
                            <button
                              key={index}
                              onClick={() => handleAnswerSelect(question.id, '', optionLetter)}
                              className={`p-3 text-left border-2 rounded-lg transition-all duration-200 ${
                                isSelected 
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-800' 
                                  : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                              }`}
                            >
                              <span className="font-semibold mr-2">{optionLetter}.</span>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={submitQuiz}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
                >
                  Nộp Bài
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render reading and listening exercises
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                {currentCategory.toUpperCase()}
              </span>
              <span className="text-gray-500">
                {totalQuestions} câu hỏi
              </span>
            </div>

            <div className="space-y-12">
              {currentExercise.map((exercise, exerciseIndex) => (
                <div key={exercise.id} className="border-b border-gray-200 pb-8 last:border-b-0">
                  
                  {/* Exercise Title */}
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    {exerciseIndex + 1}. {exercise.title}
                  </h2>

                  {/* Audio Player for Listening */}
                  {currentCategory === 'listening' && (
                    <div className="mb-8 p-6 bg-gray-50 rounded-lg border-l-4 border-green-500">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <span className="mr-2">🎧</span>
                        Audio
                      </h3>
                      
                      <audio 
                        ref={audioRef}
                        onEnded={() => setIsAudioPlaying(false)}
                        onPlay={() => setIsAudioPlaying(true)}
                        onPause={() => setIsAudioPlaying(false)}
                        className="hidden"
                      >
                        <source src={exercise.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>

                      <div className="flex items-center space-x-4">
                        <button
                          onClick={playAudio}
                          disabled={isAudioPlaying}
                          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition duration-200"
                        >
                          <span className="mr-2">▶</span>
                          {isAudioPlaying ? 'Đang phát...' : 'Nghe'}
                        </button>
                        
                        <button
                          onClick={pauseAudio}
                          className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-200"
                        >
                          <span className="mr-2">⏸</span>
                          Tạm dừng
                        </button>
                        
                        <button
                          onClick={resetAudio}
                          className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                        >
                          <span className="mr-2">⏹</span>
                          Đặt lại
                        </button>
                      </div>

                      {/* Show transcript for demo since audio files don't exist */}
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 mb-2">
                          <strong>Transcript (for demo):</strong>
                        </p>
                        <p className="text-gray-700 italic">
                          {exercise.transcript}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reading Passage */}
                  {currentCategory === 'reading' && (
                    <div className="mb-8 p-6 passage-container rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <span className="mr-2">📖</span>
                        Reading Passage
                      </h3>
                      <div className="reading-passage">
                        {exercise.passage.split('\n').map((paragraph, index) => (
                          paragraph.trim() ? (
                            <p key={index} className="passage-text text-gray-700">
                              {paragraph}
                            </p>
                          ) : (
                            <br key={index} />
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Questions */}
                  <div className="space-y-6">
                    {exercise.questions.map((question, qIndex) => {
                      const key = `${exercise.id}-${question.id}`;
                      
                      if (question.type === 'fill-blank') {
                        return (
                          <div key={question.id} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">
                              {qIndex + 1}. Fill in the blanks:
                            </h4>
                            <p className="text-gray-700 mb-4">{question.question}</p>
                            <div className="space-y-2">
                              {question.blanks.map((blank, blankIndex) => (
                                <div key={blankIndex} className="flex items-center space-x-2">
                                  <span className="text-gray-600">Blank {blankIndex + 1}:</span>
                                  <input
                                    type="text"
                                    placeholder="Your answer..."
                                    className="border-2 border-gray-300 rounded px-3 py-2 focus:border-yellow-400 focus:outline-none"
                                    onChange={(e) => handleFillBlankChange(exercise.id, question.id, blankIndex, e.target.value)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (question.type === 'true-false') {
                        const selectedAnswer = selectedAnswers[key];
                        return (
                          <div key={question.id} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">
                              {qIndex + 1}. True or False:
                            </h4>
                            <p className="text-gray-700 mb-4">{question.question}</p>
                            <div className="flex space-x-4">
                              <button
                                onClick={() => handleAnswerSelect(exercise.id, question.id, 'true')}
                                className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
                                  selectedAnswer === 'true'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                True
                              </button>
                              <button
                                onClick={() => handleAnswerSelect(exercise.id, question.id, 'false')}
                                className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
                                  selectedAnswer === 'false'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                False
                              </button>
                            </div>
                          </div>
                        );
                      }

                      if (question.type === 'multiple-choice') {
                        const selectedAnswer = selectedAnswers[key];
                        return (
                          <div key={question.id} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">
                              {qIndex + 1}. {question.question}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {question.options.map((option, index) => {
                                const optionLetter = getOptionLetter(index);
                                const isSelected = selectedAnswer === optionLetter;
                                
                                return (
                                  <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(exercise.id, question.id, optionLetter)}
                                    className={`p-3 text-left border-2 rounded-lg transition-all duration-200 ${
                                      isSelected 
                                        ? 'border-green-500 bg-green-100 text-green-800' 
                                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                                    }`}
                                  >
                                    <span className="font-semibold mr-2">{optionLetter}.</span>
                                    {option}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={submitQuiz}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
              >
                Nộp Bài
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show category selection screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Kiểm Tra Tiếng Anh</h1>
          <p className="text-lg text-gray-600">Chọn loại bài tập và số lượng câu hỏi để bắt đầu</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Number of Exercises Selector */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-gray-700 mb-4">
              Số lượng bài tập:
            </label>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumberOfExercises(num)}
                  className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                    numberOfExercises === num
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {num} bài
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <h2 className="text-lg font-medium text-gray-700 mb-4">Chọn loại bài tập:</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.keys(questionsData).map((category) => {
                const categoryInfo = {
                  reading: {
                    icon: '📖',
                    title: 'Reading Comprehension',
                    description: 'Đọc đoạn văn và trả lời câu hỏi',
                    color: 'blue'
                  },
                  listening: {
                    icon: '🎧',
                    title: 'Listening',
                    description: 'Nghe audio và làm bài tập',
                    color: 'green'
                  },
                  clozetext: {
                    icon: '✏️',
                    title: 'Cloze Test',
                    description: 'Điền từ vào chỗ trống',
                    color: 'purple'
                  }
                };

                const info = categoryInfo[category];
                if (!info) return null;

                return (
                  <div
                    key={category}
                    className="border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => startQuiz(category)}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">
                        {info.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {info.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {info.description}
                      </p>
                      <p className="text-sm text-indigo-600">
                        {questionsData[category]?.length || 0} bài tập có sẵn
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <Link to="/" className="text-2xl font-bold text-indigo-600">
                English Quiz
              </Link>
              <div className="flex space-x-4">
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium"
                >
                  Quiz
                </Link>
                <Link 
                  to="/admin" 
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium"
                >
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<QuizApp />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/add" element={<AdminAddExercise />} />
          <Route path="/admin/edit/:id" element={<AdminAddExercise />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
