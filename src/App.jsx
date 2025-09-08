import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { exerciseAPI, userAPI } from './services/api.js';
import AdminDashboard from './components/AdminDashboard';
import AdminAddExercise from './components/AdminAddExercise';
import UserStats from './components/UserStats';
import React from 'react';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Đã có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-4">Ứng dụng gặp lỗi không mong muốn. Vui lòng tải lại trang.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  const [numberOfQuestions, setNumberOfQuestions] = useState({
    reading: 5,
    listening: 5,
    clozetext: 10
  });
  const [questionOrder, setQuestionOrder] = useState('category'); // 'category' or 'mixed'
  const [quizStarted, setQuizStarted] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [showMixedQuizSetup, setShowMixedQuizSetup] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState({
    reading: false,
    listening: false,
    clozetext: false
  });
  // New states for step-by-step quiz mode
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allQuestions, setAllQuestions] = useState([]);
  const [questionNotes, setQuestionNotes] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [showAnswerResult, setShowAnswerResult] = useState(false);
  const [currentAnswerCorrect, setCurrentAnswerCorrect] = useState(false);
  const [stepByStepMode, setStepByStepMode] = useState(true);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  // New states for question selection and user system
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [allAvailableQuestions, setAllAvailableQuestions] = useState([]);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [userStats, setUserStats] = useState(null);
  const [prioritizeWrongAnswers, setPrioritizeWrongAnswers] = useState(false);
  const [showUserStats, setShowUserStats] = useState(false);
  const [isPriorityQuiz, setIsPriorityQuiz] = useState(false);
  const [priorityQuestions, setPriorityQuestions] = useState([]);
  // States for time tracking
  const [questionStartTime, setQuestionStartTime] = useState({});
  const [questionTimeSpent, setQuestionTimeSpent] = useState({});
  const [quizStartTime, setQuizStartTime] = useState(null);
  const audioRef = useRef(null);

  // Helper function to prepare questions list for step-by-step mode
  const prepareQuestionsList = (exercises, category) => {
    let questions = [];
    
    if (category === 'clozetext') {
      exercises.forEach((question, index) => {
        questions.push({
          ...question,
          questionIndex: index,
          questionType: 'clozetext',
          category: 'clozetext',
          exerciseId: question.id,
          exerciseTitle: `Cloze Test ${question.id}`,
          questionText: question.question,
          displayIndex: index + 1
        });
      });
    } else if (category === 'mixed') {
      // For mixed quiz
      exercises[0].questions.forEach((question, index) => {
        questions.push({
          ...question,
          questionIndex: index,
          questionType: question.type || (question.category === 'clozetext' ? 'clozetext' : 'multiple-choice'),
          category: question.category || category,
          exerciseId: question.exerciseId || exercises[0].id,
          exerciseTitle: question.exerciseTitle || exercises[0].title,
          questionText: question.question,
          displayIndex: index + 1
        });
      });
    } else {
      // For reading/listening
      let questionIndex = 0;
      exercises.forEach((exercise) => {
        exercise.questions.forEach((question) => {
          questions.push({
            ...question,
            questionIndex: questionIndex,
            questionType: question.type,
            category: category,
            exerciseId: exercise.id,
            exerciseTitle: exercise.title,
            questionText: question.question,
            passage: exercise.passage,
            audioUrl: exercise.audioUrl,
            transcript: exercise.transcript,
            displayIndex: questionIndex + 1
          });
          questionIndex++;
        });
      });
    }
    
    return questions;
  };

  // Navigate to specific question
  const goToQuestion = (index) => {
    if (index >= 0 && index < allQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Go to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(false);
      setShowAnswerResult(false);
      setCurrentAnswerCorrect(false);
      
      // Track start time for the new question
      const nextQuestion = allQuestions[currentQuestionIndex + 1];
      const nextKey = `${nextQuestion.exerciseId}-${nextQuestion.id}`;
      setQuestionStartTime(prev => ({
        ...prev,
        [nextKey]: Date.now()
      }));
      
      // Check if next question is already answered
      const nextQuestionKey = getQuestionKey(currentQuestionIndex + 1);
      if (selectedAnswers[nextQuestionKey]) {
        const isCorrect = selectedAnswers[nextQuestionKey] === nextQuestion.correct;
        setCurrentAnswerCorrect(isCorrect);
        setShowAnswerResult(true);
        setShowExplanation(true);
      }
    }
  };

  // Helper function to get question key
  const getQuestionKey = (questionIndex) => {
    const question = allQuestions[questionIndex];
    return currentExercise[0]?.isMixed ? 
      `${question.exerciseId}-${question.id}` : 
      `${currentExercise[0]?.id}-${question.id}`;
  };

  // Go to previous question
  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowExplanation(false);
      setShowAnswerResult(false);
      setCurrentAnswerCorrect(false);
      
      // Check if previous question is already answered
      const prevQuestionKey = getQuestionKey(currentQuestionIndex - 1);
      if (selectedAnswers[prevQuestionKey]) {
        const prevQuestion = allQuestions[currentQuestionIndex - 1];
        const isCorrect = selectedAnswers[prevQuestionKey] === prevQuestion.correct;
        setCurrentAnswerCorrect(isCorrect);
        setShowAnswerResult(true);
        setShowExplanation(true);
      }
    }
  };

  // Update question note
  const updateQuestionNote = (questionIndex, note) => {
    setQuestionNotes(prev => ({
      ...prev,
      [questionIndex]: note
    }));
  };

  // Check if question is answered
  const isQuestionAnswered = (question) => {
    const key = question.category === 'clozetext' ? 
      `${question.id}` : 
      `${question.exerciseId}-${question.id}`;
    
    if (question.questionType === 'fill-blank') {
      // Check if all blanks are filled
      return question.blanks?.every((_, index) => {
        const blankKey = `${question.exerciseId}-${question.id}-${index}`;
        return fillBlankAnswers[blankKey]?.trim();
      });
    } else {
      return selectedAnswers[key];
    }
  };

  // User Authentication Functions
  // Clear all localStorage data
  const clearAllUserData = () => {
    localStorage.removeItem('quizUser');
    localStorage.removeItem('userStats'); // Keep for backward compatibility
    // Clear all user-specific stats
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    allUsers.forEach(user => {
      localStorage.removeItem(`userStats_${user.id}`);
    });
    localStorage.removeItem('allUsers');
    setUser(null);
    setUserStats(null);
    window.location.reload();
  };

  const loadUserFromStorage = () => {
    try {
      const savedUser = localStorage.getItem('quizUser');
      
      if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
        const userData = JSON.parse(savedUser);
        if (userData && typeof userData === 'object') {
          setUser(userData);
          
          // Load user-specific stats
          const savedStats = localStorage.getItem(`userStats_${userData.id}`);
          if (savedStats && savedStats !== 'undefined' && savedStats !== 'null') {
            const statsData = JSON.parse(savedStats);
            // Ensure all required fields exist and are correct types
            if (statsData && typeof statsData === 'object') {
              const validStats = {
                userId: statsData.userId || userData.id,
                totalQuestions: Number(statsData.totalQuestions) || 0,
                correctAnswers: Number(statsData.correctAnswers) || 0,
                wrongAnswers: Array.isArray(statsData.wrongAnswers) ? statsData.wrongAnswers : [],
                frequentlyWrong: Array.isArray(statsData.frequentlyWrong) ? statsData.frequentlyWrong : [],
                categoryStats: statsData.categoryStats || {
                  reading: { total: 0, correct: 0 },
                  listening: { total: 0, correct: 0 },
                  clozetext: { total: 0, correct: 0 }
                }
              };
              setUserStats(validStats);
            }
          } else {
            // Create default stats if none exist
            const defaultStats = {
              userId: userData.id,
              totalQuestions: 0,
              correctAnswers: 0,
              wrongAnswers: [],
              frequentlyWrong: [],
              categoryStats: {
                reading: { total: 0, correct: 0 },
                listening: { total: 0, correct: 0 },
                clozetext: { total: 0, correct: 0 }
              }
            };
            setUserStats(defaultStats);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Clear corrupted data
      localStorage.removeItem('quizUser');
      localStorage.removeItem('userStats'); // Keep for backward compatibility
      setUser(null);
      setUserStats(null);
    }
  };

  const saveUserToStorage = (userData, statsData = null) => {
    try {
      if (userData && typeof userData === 'object') {
        localStorage.setItem('quizUser', JSON.stringify(userData));
        // Save user-specific stats
        if (statsData && typeof statsData === 'object') {
          localStorage.setItem(`userStats_${userData.id}`, JSON.stringify(statsData));
        }
      }
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const handleRegister = async (username, password, email) => {
    // Validate input fields
    if (!username || !password || !email) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    
    if (username.trim().length < 3) {
      alert('Tên đăng nhập phải có ít nhất 3 ký tự!');
      return;
    }
    
    if (password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    
    try {
      const response = await userAPI.register({
        username,
        email,
        password
      });

      if (response.success) {
        setUser(response.user);
        setUserStats(response.user.stats);
        saveUserToStorage(response.user, response.user.stats);
        setShowAuth(false);
        alert(response.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi đăng ký!';
      alert(errorMessage);
    }
  };

  const handleLogin = async (username, password) => {
    // Validate input fields
    if (!username || !password) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      const response = await userAPI.login({
        username,
        password
      });

      if (response.success) {
        setUser(response.user);
        setUserStats(response.user.stats);
        saveUserToStorage(response.user, response.user.stats);
        setShowAuth(false);
        alert(response.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi đăng nhập!';
      alert(errorMessage);
    }
  };

  const handleLogout = () => {
    if (user) {
      // Remove user-specific stats
      localStorage.removeItem(`userStats_${user.id}`);
    }
    setUser(null);
    setUserStats(null);
    localStorage.removeItem('quizUser');
    // Remove old userStats key if it exists (backward compatibility)
    localStorage.removeItem('userStats');
  };

  // Update user statistics
  const updateUserStats = async (results) => {
    if (!user || !userStats) return;

    try {
      // Prepare results for API
      const apiResults = results.map(result => ({
        id: result.id,
        exerciseId: result.exerciseId || result.id,
        category: result.category,
        type: result.type,
        question: result.question,
        userAnswer: result.userAnswer,
        correctAnswer: result.correctAnswer,
        isCorrect: result.isCorrect
      }));

      // Update stats via API with time tracking
      const response = await userAPI.updateStats(user._id, apiResults, questionTimeSpent);
      
      if (response.success) {
        setUserStats(response.stats);
        saveUserToStorage(user, response.stats);
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
      
      // Fallback to local update if API fails
      const newStats = { ...userStats };
      
      results.forEach(result => {
        newStats.totalQuestions++;
        newStats.categoryStats[result.category].total++;
        
        if (result.isCorrect) {
          newStats.correctAnswers++;
          newStats.categoryStats[result.category].correct++;
        } else {
          // Track wrong answers
          const wrongAnswer = {
            questionId: result.id,
            question: result.question,
            category: result.category,
            userAnswer: result.userAnswer,
            correctAnswer: result.correctAnswer,
            timestamp: new Date().toISOString()
          };
          
          newStats.wrongAnswers.push(wrongAnswer);
          
          // Update frequently wrong questions
          const existingWrong = newStats.frequentlyWrong.find(q => q.questionId === result.id);
          if (existingWrong) {
            existingWrong.count++;
            existingWrong.lastAttempt = new Date().toISOString();
          } else {
            newStats.frequentlyWrong.push({
              questionId: result.id,
              question: result.question,
              category: result.category,
              count: 1,
              lastAttempt: new Date().toISOString()
            });
          }
        }
      });
      
      // Sort frequently wrong questions by count
      newStats.frequentlyWrong.sort((a, b) => b.count - a.count);
      
      setUserStats(newStats);
      saveUserToStorage(user, newStats);
    }
  };

  // Question Selection Functions
  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestionIds(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const selectAllQuestionsInCategory = (category) => {
    const categoryQuestions = allAvailableQuestions
      .filter(q => q.category === category)
      .map(q => q.id);
    
    setSelectedQuestionIds(prev => {
      const withoutCategory = prev.filter(id => 
        !allAvailableQuestions.find(q => q.id === id && q.category === category)
      );
      return [...withoutCategory, ...categoryQuestions];
    });
  };

  const clearCategorySelection = (category) => {
    setSelectedQuestionIds(prev => 
      prev.filter(id => 
        !allAvailableQuestions.find(q => q.id === id && q.category === category)
      )
    );
  };

  const startCustomQuiz = () => {
    if (selectedQuestionIds.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi!');
      return;
    }

    // Filter selected questions
    let customQuestions = [];
    
    selectedQuestionIds.forEach(questionId => {
      const question = allAvailableQuestions.find(q => q.id === questionId);
      if (!question) return;

      if (question.category === 'clozetest') {
        // Find the actual clozetest question
        const clozequestion = questionsData.clozetext?.find(q => q.id === question.id);
        if (clozequestion) {
          customQuestions.push({
            ...clozequestion,
            questionIndex: customQuestions.length,
            questionType: 'clozetext',
            category: 'clozetest',
            exerciseId: clozequestion.id,
            exerciseTitle: `Cloze Test ${clozequestion.id}`,
            questionText: clozequestion.question,
            displayIndex: customQuestions.length + 1
          });
        }
      } else {
        // Find the actual reading/listening question
        const exercise = questionsData[question.category]?.find(ex => ex.id === question.exerciseId);
        const actualQuestion = exercise?.questions?.find(q => q.id === question.questionId);
        
        if (actualQuestion && exercise) {
          customQuestions.push({
            ...actualQuestion,
            questionIndex: customQuestions.length,
            questionType: actualQuestion.type,
            category: question.category,
            exerciseId: exercise.id,
            exerciseTitle: exercise.title,
            questionText: actualQuestion.question,
            passage: exercise.passage,
            audioUrl: exercise.audioUrl,
            transcript: exercise.transcript,
            displayIndex: customQuestions.length + 1
          });
        }
      }
    });

    // Prioritize frequently wrong answers if enabled
    if (prioritizeWrongAnswers && userStats?.frequentlyWrong?.length > 0) {
      const wrongQuestionIds = userStats.frequentlyWrong.map(w => w.questionId);
      customQuestions.sort((a, b) => {
        const aIsWrong = wrongQuestionIds.includes(a.id || `${a.exerciseId}-${a.id}`);
        const bIsWrong = wrongQuestionIds.includes(b.id || `${b.exerciseId}-${b.id}`);
        
        if (aIsWrong && !bIsWrong) return -1;
        if (!aIsWrong && bIsWrong) return 1;
        return 0;
      });
    }

    // Create virtual exercise
    const customExercise = [{
      id: 'custom-quiz',
      title: 'Custom Selected Questions',
      questions: customQuestions,
      isCustom: true
    }];

    setCurrentCategory('custom');
    setCurrentExercise(customExercise);
    setAllQuestions(customQuestions);
    setCurrentQuestionIndex(0);
    setAnsweredQuestions(new Set());
    setQuestionNotes({});
    setScore(0);
    setQuizStarted(true);
    setShowQuestionSelector(false);
    setSelectedAnswers({});
    setFillBlankAnswers({});
    setShowResult(false);
    setShowDetailedResults(false);
    setCorrectAnswers([]);
    setTotalQuestions(customQuestions.length);
  };

  // Get option letter (A, B, C, D)
  const getOptionLetter = (index) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  // Enhanced answer selection with immediate feedback
  const handleAnswerSelectWithNext = (exerciseId, questionId, answer) => {
    // ALWAYS use the same key format regardless of question type
    const key = `${exerciseId}-${questionId}`;
    
    // Track time spent on this question
    const now = Date.now();
    const startTime = questionStartTime[key] || quizStartTime || now;
    const timeSpent = Math.round((now - startTime) / 1000); // in seconds
    
    setQuestionTimeSpent(prev => ({
      ...prev,
      [key]: timeSpent
    }));
    
    setSelectedAnswers(prev => ({
      ...prev,
      [key]: answer
    }));

    // Mark question as answered
    setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));

    // Check if answer is correct
    const currentQuestion = allQuestions[currentQuestionIndex];
    const isCorrect = answer === (currentQuestion.correct || currentQuestion.correctAnswer);
    
    // Show result and explanation immediately
    setCurrentAnswerCorrect(isCorrect);
    setShowAnswerResult(true);
    setShowExplanation(true);
  };

  // Helper function to render individual questions
  const renderQuestion = (question, qIndex, exerciseId, mixedExerciseId = null) => {
    const key = mixedExerciseId ? 
      `${mixedExerciseId}-${question.id}` : 
      `${exerciseId}-${question.id}`;
    
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
                  onChange={(e) => handleFillBlankChange(
                    mixedExerciseId || exerciseId, 
                    question.id, 
                    blankIndex, 
                    e.target.value
                  )}
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
              onClick={() => handleAnswerSelect(mixedExerciseId || exerciseId, question.id, 'true')}
              className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
                selectedAnswer === 'true'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              True
            </button>
            <button
              onClick={() => handleAnswerSelect(mixedExerciseId || exerciseId, question.id, 'false')}
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
                  onClick={() => handleAnswerSelect(mixedExerciseId || exerciseId, question.id, optionLetter)}
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
  };

  // Load questions from API
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await exerciseAPI.getAll();
        setQuestionsData(data);
        
        // Prepare all available questions for selection
        let allQuestions = [];
        Object.keys(data).forEach(category => {
          if (data[category]) {
            data[category].forEach(exercise => {
              if (category === 'clozetext') {
                allQuestions.push({
                  id: exercise.id,
                  category: category,
                  question: exercise.question,
                  exerciseTitle: `${category} - ${exercise.id}`,
                  difficulty: exercise.difficulty || 'medium'
                });
              } else {
                exercise.questions?.forEach((question, index) => {
                  allQuestions.push({
                    id: `${exercise.id}-${question.id}`,
                    category: category,
                    question: question.question,
                    exerciseTitle: `${exercise.title} - Q${index + 1}`,
                    exerciseId: exercise.id,
                    questionId: question.id,
                    difficulty: question.difficulty || 'medium'
                  });
                });
              }
            });
          }
        });
        setAllAvailableQuestions(allQuestions);
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
    loadUserFromStorage();
  }, []);

  // Start quiz with selected category and number of exercises
  const startQuiz = (category) => {
    if (!questionsData || !questionsData[category]) return;
    
    // Initialize time tracking
    setQuizStartTime(Date.now());
    setQuestionStartTime({});
    setQuestionTimeSpent({});
    
    const categoryData = questionsData[category];
    let selectedExercises;
    
    if (category === 'clozetext') {
      // For clozetext, keep the old individual question format
      const shuffled = [...categoryData].sort(() => 0.5 - Math.random());
      const questionsToSelect = numberOfQuestions[category];
      selectedExercises = shuffled.slice(0, Math.min(questionsToSelect, categoryData.length));
    } else {
      // For reading and listening, select complete exercises
      const shuffled = [...categoryData].sort(() => 0.5 - Math.random());
      selectedExercises = shuffled.slice(0, Math.min(numberOfExercises, categoryData.length));
      
      // If we need to limit questions per exercise
      const questionsPerCategory = numberOfQuestions[category];
      selectedExercises = selectedExercises.map(exercise => {
        if (exercise.questions.length > questionsPerCategory) {
          const shuffledQuestions = [...exercise.questions].sort(() => 0.5 - Math.random());
          return {
            ...exercise,
            questions: shuffledQuestions.slice(0, questionsPerCategory)
          };
        }
        return exercise;
      });
    }
    
    // Apply question ordering
    if (questionOrder === 'mixed' && category !== 'clozetext') {
      // Mix questions from all exercises
      let allQuestions = [];
      selectedExercises.forEach(exercise => {
        exercise.questions.forEach(question => {
          allQuestions.push({
            ...question,
            exerciseId: exercise.id,
            exerciseTitle: exercise.title,
            passage: exercise.passage,
            audioUrl: exercise.audioUrl,
            transcript: exercise.transcript
          });
        });
      });
      
      // Shuffle all questions
      allQuestions = allQuestions.sort(() => 0.5 - Math.random());
      
      // Create a virtual exercise with mixed questions
      selectedExercises = [{
        id: 'mixed-questions',
        title: 'Mixed Questions',
        questions: allQuestions,
        isMixed: true
      }];
    }
    
    setCurrentCategory(category);
    setCurrentExercise(selectedExercises);
    
    // Prepare questions list for step-by-step mode
    const questionsList = prepareQuestionsList(selectedExercises, category);
    setAllQuestions(questionsList);
    setCurrentQuestionIndex(0);
    setAnsweredQuestions(new Set());
    setQuestionNotes({});
    
    setScore(0);
    setQuizStarted(true);
    setSelectedAnswers({});
    setFillBlankAnswers({});
    setShowResult(false);
    setShowDetailedResults(false);
    setCorrectAnswers([]);
    
    // Calculate total questions
    if (category === 'clozetext') {
      setTotalQuestions(selectedExercises.length);
    } else {
      const total = selectedExercises.reduce((sum, exercise) => sum + exercise.questions.length, 0);
      setTotalQuestions(total);
    }
    
    // Start timing for first question
    if (questionsList.length > 0) {
      const firstQuestion = questionsList[0];
      const firstKey = `${firstQuestion.exerciseId}-${firstQuestion.id}`;
      setQuestionStartTime(prev => ({
        ...prev,
        [firstKey]: Date.now()
      }));
    }
  };

  // Start mixed quiz with selected categories
  const startMixedQuiz = () => {
    const selectedCats = Object.keys(selectedCategories).filter(cat => selectedCategories[cat]);
    if (selectedCats.length === 0) return;

    let allQuestions = [];
    
    selectedCats.forEach(category => {
      const categoryData = questionsData[category];
      if (!categoryData) return;
      
      if (category === 'clozetext') {
        // Add clozetext questions
        const shuffled = [...categoryData].sort(() => 0.5 - Math.random());
        const questionsToSelect = numberOfQuestions[category];
        const selected = shuffled.slice(0, Math.min(questionsToSelect, categoryData.length));
        
        selected.forEach(question => {
          allQuestions.push({
            ...question,
            category: 'clozetext',
            exerciseId: question.id,
            exerciseTitle: `Cloze Test ${question.id}`,
            type: 'multiple-choice'
          });
        });
      } else {
        // Add reading/listening questions
        const shuffled = [...categoryData].sort(() => 0.5 - Math.random());
        const selectedExercises = shuffled.slice(0, Math.min(numberOfExercises, categoryData.length));
        
        selectedExercises.forEach(exercise => {
          const questionsPerCategory = numberOfQuestions[category];
          let exerciseQuestions = exercise.questions;
          
          if (exerciseQuestions.length > questionsPerCategory) {
            const shuffledQuestions = [...exerciseQuestions].sort(() => 0.5 - Math.random());
            exerciseQuestions = shuffledQuestions.slice(0, questionsPerCategory);
          }
          
          exerciseQuestions.forEach(question => {
            allQuestions.push({
              ...question,
              category,
              exerciseId: exercise.id,
              exerciseTitle: exercise.title,
              passage: exercise.passage,
              audioUrl: exercise.audioUrl,
              transcript: exercise.transcript
            });
          });
        });
      }
    });
    
    // Shuffle all questions
    allQuestions = allQuestions.sort(() => 0.5 - Math.random());
    
    // Create a virtual exercise with mixed questions
    const mixedExercise = [{
      id: 'mixed-comprehensive',
      title: 'Comprehensive Mixed Test',
      questions: allQuestions,
      isMixed: true
    }];
    
    setCurrentCategory('mixed');
    setCurrentExercise(mixedExercise);
    
    // Prepare questions list for step-by-step mode
    const questionsList = prepareQuestionsList(mixedExercise, 'mixed');
    setAllQuestions(questionsList);
    setCurrentQuestionIndex(0);
    setAnsweredQuestions(new Set());
    setQuestionNotes({});
    
    setScore(0);
    setQuizStarted(true);
    setShowMixedQuizSetup(false);
    setSelectedAnswers({});
    setFillBlankAnswers({});
    setShowResult(false);
    setShowDetailedResults(false);
    setCorrectAnswers([]);
    setTotalQuestions(allQuestions.length);
  };

  // Start priority quiz based on user's weak points
  const startPriorityQuiz = (category, questions) => {
    // Initialize time tracking
    setQuizStartTime(Date.now());
    setQuestionStartTime({});
    setQuestionTimeSpent({});
    
    // Set quiz as priority quiz
    setIsPriorityQuiz(true);
    setPriorityQuestions(questions);
    
    // Convert priority questions to standard format
    const formattedQuestions = questions.map((pq, index) => ({
      id: pq.questionId,
      exerciseId: pq.exerciseId,
      category: pq.category,
      type: pq.questionType,
      question: pq.question,
      questionText: pq.question,
      // We'll need to fetch full question data from the original questions
      // For now, use basic structure
      questionIndex: index,
      displayIndex: index + 1,
      exerciseTitle: `Luyện tập ưu tiên`,
      isCorrect: false,
      userAnswer: '',
      options: [], // Will be populated when we fetch full data
      correct: '', // Will be populated when we fetch full data
    }));
    
    setCurrentCategory(category || 'priority');
    setAllQuestions(formattedQuestions);
    setCurrentQuestionIndex(0);
    setAnsweredQuestions(new Set());
    setQuestionNotes({});
    
    setScore(0);
    setQuizStarted(true);
    setSelectedAnswers({});
    setFillBlankAnswers({});
    setShowResult(false);
    setShowDetailedResults(false);
    setCorrectAnswers([]);
    setTotalQuestions(formattedQuestions.length);
    
    // Start timing for first question
    if (formattedQuestions.length > 0) {
      const firstQuestion = formattedQuestions[0];
      const firstKey = `${firstQuestion.exerciseId}-${firstQuestion.id}`;
      setQuestionStartTime(prev => ({
        ...prev,
        [firstKey]: Date.now()
      }));
    }
  };

  // Handle answer selection for multiple choice and true/false
  const handleAnswerSelect = (exerciseId, questionId, answer) => {
    // Consistent key generation
    const key = `${exerciseId}-${questionId}`;
    setSelectedAnswers(prev => ({
      ...prev,
      [key]: answer
    }));
  };

  // Handle fill in the blank answers
  const handleFillBlankChange = (exerciseId, questionId, blankIndex, value) => {
    const key = currentExercise[0]?.isMixed ?
      `${exerciseId}-${questionId}-${blankIndex}` :
      `${exerciseId}-${questionId}-${blankIndex}`;
    setFillBlankAnswers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Calculate score and submit quiz
  const submitQuiz = () => {
    let correctCount = 0;
    let detailedResults = [];
    
    // UNIFIED LOGIC for all quiz types
    if (stepByStepMode && allQuestions.length > 0) {
      // Step-by-step mode - use allQuestions
      allQuestions.forEach((question, index) => {
        const key = `${question.exerciseId}-${question.id}`;
        
        let isCorrect = false;
        let userAnswer = '';
        let correctAnswer = '';
        
        if (question.type === 'fill-blank') {
          isCorrect = true;
          let userAnswers = [];
          question.blanks.forEach((correctBlank, blankIndex) => {
            const blankKey = `${question.exerciseId}-${question.id}-${blankIndex}`;
            const userBlankAnswer = fillBlankAnswers[blankKey]?.toLowerCase().trim();
            userAnswers.push(userBlankAnswer || '');
            if (userBlankAnswer !== correctBlank.toLowerCase()) {
              isCorrect = false;
            }
          });
          userAnswer = userAnswers.join(', ');
          correctAnswer = question.blanks.join(', ');
        } else {
          // Multiple choice, true/false, clozetext
          userAnswer = selectedAnswers[key] || '';
          correctAnswer = question.correct || question.correctAnswer || '';
          isCorrect = userAnswer === correctAnswer;
        }
        
        if (isCorrect) correctCount++;
        
        detailedResults.push({
          id: question.id,
          exerciseId: question.exerciseId,
          exerciseTitle: question.exerciseTitle || '',
          question: question.question || question.questionText,
          type: question.type || question.questionType,
          category: question.category,
          userAnswer,
          correctAnswer,
          isCorrect,
          options: question.options || [],
          passage: question.passage || '',
          audioUrl: question.audioUrl || '',
          image: question.image || '',
          explanation: question.explanation || ''
        });
      });
    } else {
      // Legacy mode - use currentExercise structure
      if (currentCategory === 'clozetext') {
        currentExercise.forEach((question) => {
          const key = `${question.id}-${question.id}`;
          const userAnswer = selectedAnswers[key] || '';
          const isCorrect = userAnswer === question.correct;
          
          if (isCorrect) correctCount++;
          
          detailedResults.push({
            id: question.id,
            question: question.question,
            userAnswer,
            correctAnswer: question.correct,
            isCorrect,
            options: question.options,
            image: question.image,
            category: 'clozetext',
            explanation: question.explanation || ''
          });
        });
      } else {
        // Handle reading, listening and mixed scoring
        currentExercise.forEach((exercise) => {
          exercise.questions.forEach((question) => {
            const key = `${exercise.id || question.exerciseId}-${question.id}`;
            
            let isCorrect = false;
            let userAnswer = '';
            let correctAnswer = '';
            
            if (question.type === 'fill-blank') {
              isCorrect = true;
              let userAnswers = [];
              question.blanks.forEach((correctBlank, index) => {
                const blankKey = `${exercise.id || question.exerciseId}-${question.id}-${index}`;
                const userBlankAnswer = fillBlankAnswers[blankKey]?.toLowerCase().trim();
                userAnswers.push(userBlankAnswer || '');
                if (userBlankAnswer !== correctBlank.toLowerCase()) {
                  isCorrect = false;
                }
              });
              userAnswer = userAnswers.join(', ');
              correctAnswer = question.blanks.join(', ');
            } else {
              userAnswer = selectedAnswers[key] || '';
              correctAnswer = question.correct || question.correctAnswer || '';
              isCorrect = userAnswer === correctAnswer;
            }
            
            if (isCorrect) correctCount++;
            
            detailedResults.push({
              id: question.id,
              exerciseId: exercise.id || question.exerciseId,
              exerciseTitle: exercise.title || question.exerciseTitle || '',
              question: question.question,
              type: question.type || 'multiple-choice',
              category: question.category || currentCategory,
              userAnswer,
              correctAnswer,
              isCorrect,
              options: question.options || [],
              passage: exercise.passage || question.passage || '',
              audioUrl: exercise.audioUrl || question.audioUrl || '',
              image: question.image || '',
              explanation: question.explanation || ''
            });
          });
        });
      }
    }
    
    setScore(correctCount);
    setCorrectAnswers(detailedResults);
    setShowResult(true);
    
    // Update user statistics if user is logged in
    if (user && userStats) {
      updateUserStats(detailedResults);
    }
  };

  // Reset quiz
  const resetQuiz = () => {
    setQuizStarted(false);
    setShowResult(false);
    setShowDetailedResults(false);
    setShowMixedQuizSetup(false);
    setSelectedAnswers({});
    setFillBlankAnswers({});
    setScore(0);
    setCurrentExercise(null);
    setCorrectAnswers([]);
    setSelectedCategories({
      reading: false,
      listening: false,
      clozetext: false
    });
    // Reset step-by-step mode states
    setCurrentQuestionIndex(0);
    setAllQuestions([]);
    setQuestionNotes({});
    setAnsweredQuestions(new Set());
    setShowExplanation(false);
    setShowAnswerResult(false);
    setCurrentAnswerCorrect(false);
    // Reset priority quiz states
    setIsPriorityQuiz(false);
    setPriorityQuestions([]);
    // Reset time tracking
    setQuizStartTime(null);
    setQuestionStartTime({});
    setQuestionTimeSpent({});
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

  // Auth Modal
  if (showAuth) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </h2>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            if (authMode === 'login') {
              handleLogin(formData.get('username'), formData.get('password'));
            } else {
              handleRegister(
                formData.get('username'), 
                formData.get('password'),
                formData.get('email')
              );
            }
          }}>
            {authMode === 'register' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  placeholder="your.email@example.com"
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
              <input
                type="text"
                name="username"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                placeholder="username"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
              <input
                type="password"
                name="password"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
          
          {/* Debug section - can be removed in production */}
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
            <details>
              <summary className="cursor-pointer text-gray-600">Debug Info</summary>
              <div className="mt-2 space-y-1">
                <p>Authentication: Database-based</p>
                <p>Server URL: {import.meta.env.DEV ? '/api' : 'http://localhost:5000/api'}</p>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/health');
                      const data = await response.json();
                      alert(`Server Status: ${data.status}\nDatabase: ${data.database.status}`);
                    } catch (error) {
                      alert(`Server Error: ${error.message}`);
                    }
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Check Server Status
                </button>
              </div>
            </details>
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAuth(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question Selector Modal
  if (showQuestionSelector) {
    const groupedQuestions = {
      reading: allAvailableQuestions.filter(q => q.category === 'reading'),
      listening: allAvailableQuestions.filter(q => q.category === 'listening'),
      clozetext: allAvailableQuestions.filter(q => q.category === 'clozetext')
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 h-5/6 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Chọn câu hỏi cụ thể</h2>
              <div className="flex items-center space-x-4">
                {user && userStats && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={prioritizeWrongAnswers}
                      onChange={(e) => setPrioritizeWrongAnswers(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Ưu tiên câu thường sai</span>
                  </label>
                )}
                <button
                  onClick={() => setShowQuestionSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="text-gray-600 mt-2">
              Đã chọn: {selectedQuestionIds.length} câu hỏi
            </p>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              {Object.keys(groupedQuestions).map(category => {
                const categoryQuestions = groupedQuestions[category];
                const selectedInCategory = selectedQuestionIds.filter(id => 
                  categoryQuestions.some(q => q.id === id)
                ).length;
                
                return (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 capitalize">
                        {category} ({selectedInCategory}/{categoryQuestions.length})
                      </h3>
                      <div className="space-x-2">
                        <button
                          onClick={() => selectAllQuestionsInCategory(category)}
                          className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Chọn tất cả
                        </button>
                        <button
                          onClick={() => clearCategorySelection(category)}
                          className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-auto">
                      {categoryQuestions.map(question => {
                        const isSelected = selectedQuestionIds.includes(question.id);
                        const isFrequentlyWrong = userStats?.frequentlyWrong?.some(w => w.questionId === question.id);
                        
                        return (
                          <div
                            key={question.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            } ${isFrequentlyWrong ? 'ring-2 ring-red-200 bg-red-50' : ''}`}
                            onClick={() => toggleQuestionSelection(question.id)}
                          >
                            <div className="flex items-start space-x-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {question.exerciseTitle}
                                </p>
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {question.question.length > 60 
                                    ? question.question.substring(0, 60) + '...'
                                    : question.question
                                  }
                                </p>
                                {isFrequentlyWrong && userStats?.frequentlyWrong && (
                                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-600 rounded">
                                    Thường sai ({(userStats.frequentlyWrong.find(w => w?.questionId === question?.id)?.count || 0)}x)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                onClick={() => setShowQuestionSelector(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Hủy
              </button>
              <button
                onClick={startCustomQuiz}
                disabled={selectedQuestionIds.length === 0}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:bg-gray-400"
              >
                Bắt đầu làm bài ({selectedQuestionIds.length} câu)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show final results
  if (showResult) {
    if (showDetailedResults) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Kết Quả Chi Tiết</h2>
                <button
                  onClick={() => setShowDetailedResults(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Quay lại
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                <p className="text-xl font-semibold text-indigo-600">
                  Tổng điểm: {score}/{totalQuestions} ({Math.round((score / totalQuestions) * 100)}%)
                </p>
              </div>

              <div className="space-y-6">
                {correctAnswers.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    result.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  }`}>
                    <div className="flex items-center mb-2">
                      <span className={`text-lg font-semibold mr-2 ${
                        result.isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="text-sm text-gray-600">Câu {index + 1}</span>
                    </div>
                    
                    {result.exerciseTitle && (
                      <p className="text-sm text-gray-500 mb-2">
                        Bài tập: {result.exerciseTitle}
                      </p>
                    )}
                    
                    <p className="font-medium text-gray-800 mb-2">
                      {result.question}
                    </p>
                    
                    {result.image && (
                      <div className="mb-3">
                        <img 
                          src={result.image.startsWith('http') ? result.image : result.image} 
                          alt="Question illustration" 
                          className="max-w-xs rounded-lg border"
                          onError={(e) => {
                            console.error('Failed to load image:', result.image);
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {result.options && result.options.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Các lựa chọn:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {result.options.map((option, idx) => (
                            <span key={idx} className="text-sm text-gray-700">
                              {String.fromCharCode(65 + idx)}. {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Câu trả lời của bạn:</p>
                        <p className={`font-medium ${
                          result.isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.userAnswer || 'Chưa trả lời'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Đáp án đúng:</p>
                        <p className="font-medium text-green-600">
                          {result.correctAnswer}
                        </p>
                      </div>
                    </div>
                    
                    {/* Show note if exists */}
                    {questionNotes[index] && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800 font-medium mb-1">📝 Ghi chú của bạn:</p>
                        <p className="text-sm text-gray-700">{questionNotes[index]}</p>
                      </div>
                    )}

                    {/* Show explanation if exists */}
                    {result.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium mb-1">💡 Giải thích:</p>
                        <p className="text-sm text-gray-700">{result.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
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

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowDetailedResults(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Xem Chi Tiết
              </button>
              <button
                onClick={resetQuiz}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Làm Bài Mới
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz interface
  if (quizStarted && currentExercise && currentExercise.length > 0) {
    
    // Step-by-step quiz mode
    if (stepByStepMode && allQuestions.length > 0) {
      const currentQuestion = allQuestions[currentQuestionIndex];
      const isAnswered = answeredQuestions.has(currentQuestionIndex);
      const allAnswered = answeredQuestions.size === allQuestions.length;
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4">
          <div className="container mx-auto px-4 max-w-6xl">
            
            {/* Progress Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Câu {currentQuestionIndex + 1} / {allQuestions.length}
                </h2>
                <span className="text-sm text-gray-600">
                  Đã làm: {answeredQuestions.size} / {allQuestions.length}
                </span>
              </div>
              
              {/* Question Circles */}
              <div className="flex flex-wrap gap-2 justify-center">
                {allQuestions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                      answeredQuestions.has(index)
                        ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
                        : index === currentQuestionIndex
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Question Content */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Question Content - 3/4 width */}
                <div className="lg:col-span-3">
                  {/* Category Badge */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                      {currentQuestion.category?.toUpperCase() || 'QUESTION'}
                    </span>
                  </div>

                  {/* Context Information */}
                  {currentQuestion.passage && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                        <span className="mr-2">📖</span>
                        Reading Passage
                      </h3>
                      <div className="text-gray-700 leading-relaxed">
                        {currentQuestion.passage.split('\n').map((paragraph, index) => (
                          paragraph.trim() ? (
                            <p key={index} className="mb-2">{paragraph}</p>
                          ) : (
                            <br key={index} />
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {currentQuestion.audioUrl && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                        <span className="mr-2">🎧</span>
                        Audio Content
                      </h3>
                      <audio controls className="w-full mb-2">
                        <source src={currentQuestion.audioUrl} type="audio/mpeg" />
                      </audio>
                      {currentQuestion.transcript && (
                        <p className="text-sm text-gray-600">
                          <strong>Transcript:</strong> {currentQuestion.transcript}
                        </p>
                      )}
                    </div>
                  )}

                  {currentQuestion.image && (
                    <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-purple-800 mb-2 flex items-center">
                        <span className="mr-2">🖼️</span>
                        Image
                      </h3>
                      <img 
                        src={currentQuestion.image.startsWith('http') ? currentQuestion.image : currentQuestion.image} 
                        alt="Question illustration" 
                        className="max-w-md rounded-lg border shadow-sm"
                        onError={(e) => {
                          console.error('Failed to load image:', currentQuestion.image);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Question */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      {currentQuestion.questionText || currentQuestion.question}
                    </h3>

                    {/* Answer Options */}
                    {currentQuestion.questionType === 'fill-blank' ? (
                      <div className="space-y-3">
                        {currentQuestion.blanks?.map((blank, blankIndex) => (
                          <div key={blankIndex} className="flex items-center space-x-3">
                            <span className="text-gray-600 font-medium">Blank {blankIndex + 1}:</span>
                            <input
                              type="text"
                              placeholder="Your answer..."
                              className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-400 focus:outline-none"
                              onChange={(e) => handleFillBlankChange(
                                currentQuestion.exerciseId,
                                currentQuestion.id,
                                blankIndex,
                                e.target.value
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    ) : currentQuestion.questionType === 'true-false' ? (
                      <div className="flex space-x-4">
                        {['true', 'false'].map((option) => {
                          // Consistent key generation
                          const key = `${currentQuestion.exerciseId || currentQuestion.id}-${currentQuestion.id}`;
                          const isSelected = selectedAnswers[key] === option;
                          
                          return (
                            <button
                              key={option}
                              onClick={() => handleAnswerSelectWithNext(
                                currentQuestion.exerciseId || currentQuestion.id,
                                currentQuestion.id,
                                option
                              )}
                              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                                isSelected
                                  ? option === 'true' 
                                    ? 'bg-green-500 text-white shadow-lg' 
                                    : 'bg-red-500 text-white shadow-lg'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {option === 'true' ? 'True' : 'False'}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {currentQuestion.options?.map((option, index) => {
                          const optionLetter = getOptionLetter(index);
                          // Consistent key generation
                          const key = `${currentQuestion.exerciseId || currentQuestion.id}-${currentQuestion.id}`;
                          const isSelected = selectedAnswers[key] === optionLetter;
                          const hasAnswered = selectedAnswers[key] !== undefined;
                          const isCorrectAnswer = (currentQuestion.correct || currentQuestion.correctAnswer) === optionLetter;
                          
                          // Determine button style based on state
                          let buttonClass = 'p-4 text-left border-2 rounded-lg transition-all duration-200 ';
                          if (hasAnswered) {
                            if (isSelected) {
                              if (isCorrectAnswer) {
                                buttonClass += 'border-green-500 bg-green-100 text-green-800 shadow-md';
                              } else {
                                buttonClass += 'border-red-500 bg-red-100 text-red-800 shadow-md';
                              }
                            } else if (isCorrectAnswer) {
                              buttonClass += 'border-green-500 bg-green-50 text-green-700 shadow-sm';
                            } else {
                              buttonClass += 'border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed';
                            }
                          } else {
                            buttonClass += 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
                          }
                          
                          return (
                            <button
                              key={index}
                              onClick={hasAnswered ? undefined : () => handleAnswerSelectWithNext(
                                currentQuestion.exerciseId || currentQuestion.id,
                                currentQuestion.id,
                                optionLetter
                              )}
                              disabled={hasAnswered}
                              className={buttonClass}
                            >
                              <span className="font-semibold mr-3">{optionLetter}.</span>
                              {option}
                              {hasAnswered && isCorrectAnswer && (
                                <span className="ml-2 text-green-600 font-bold">✓</span>
                              )}
                              {hasAnswered && isSelected && !isCorrectAnswer && (
                                <span className="ml-2 text-red-600 font-bold">✗</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={previousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                    >
                      <span className="mr-2">←</span>
                      Câu trước
                    </button>

                    <div className="flex space-x-4">
                      {showAnswerResult ? (
                        // Show continue button when answer is selected
                        currentQuestionIndex < allQuestions.length - 1 ? (
                          <button
                            onClick={nextQuestion}
                            className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                          >
                            Tiếp tục
                            <span className="ml-2">→</span>
                          </button>
                        ) : (
                          <button
                            onClick={submitQuiz}
                            className="flex items-center px-8 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 font-semibold"
                          >
                            <span className="mr-2">✓</span>
                            Nộp bài
                          </button>
                        )
                      ) : (
                        // Show instruction when no answer selected
                        <div className="text-gray-500 text-sm italic">
                          Chọn một đáp án để tiếp tục
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes Panel - 1/4 width */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                      <span className="mr-2">📝</span>
                      Ghi chú
                    </h4>
                    <textarea
                      value={questionNotes[currentQuestionIndex] || ''}
                      onChange={(e) => updateQuestionNote(currentQuestionIndex, e.target.value)}
                      placeholder="Ghi chú cho câu hỏi này..."
                      className="w-full h-32 p-3 border border-yellow-300 rounded-lg resize-none focus:outline-none focus:border-yellow-500"
                    />
                    <p className="text-xs text-yellow-600 mt-2">
                      Ghi chú sẽ được lưu tự động
                    </p>
                  </div>

                  {/* Answer Result and Explanation Panel */}
                  {showAnswerResult && (
                    <div className={`rounded-lg p-4 border animate-fade-in ${
                      currentAnswerCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <h4 className={`font-semibold mb-3 flex items-center ${
                        currentAnswerCorrect ? 'text-green-800' : 'text-red-800'
                      }`}>
                        <span className="mr-2">{currentAnswerCorrect ? '✅' : '❌'}</span>
                        {currentAnswerCorrect ? 'Chính xác!' : 'Sai rồi!'}
                      </h4>
                      {!currentAnswerCorrect && (
                        <p className="text-sm text-red-700 mb-2">
                          Đáp án đúng: <strong>{currentQuestion?.correct}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Explanation Panel */}
                  {showExplanation && currentQuestion?.explanation && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 animate-fade-in">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                        <span className="mr-2">💡</span>
                        Giải thích
                      </h4>
                      <p className="text-sm text-gray-700">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
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
                      
                      {/* Display image if available */}
                      {question.image && (
                        <div className="mb-4">
                          <img 
                            src={question.image.startsWith('http') ? question.image : question.image} 
                            alt="Question illustration" 
                            className="max-w-md mx-auto rounded-lg border shadow-sm"
                            onError={(e) => {
                              console.error('Failed to load image:', question.image);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
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
                {currentExercise[0]?.isMixed && ' (MIXED)'}
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

                  {/* For Mixed Questions, show context for each question */}
                  {exercise.isMixed ? (
                    <div className="space-y-8">
                      {exercise.questions.map((question, qIndex) => {
                        const key = currentExercise[0]?.isMixed ? 
                          `${question.exerciseId}-${question.id}` : 
                          `${exercise.id}-${question.id}`;
                        
                        return (
                          <div key={qIndex} className="p-6 border rounded-lg bg-gray-50">
                            <div className="mb-4">
                              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                                {question.category?.toUpperCase() || 'UNKNOWN'}
                              </span>
                            </div>
                            
                            {/* Show context for this specific question */}
                            {question.passage && (
                              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-blue-800 mb-2">📖 Đoạn văn:</h4>
                                <p className="text-gray-700">{question.passage}</p>
                              </div>
                            )}
                            
                            {question.audioUrl && (
                              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                                <h4 className="font-semibold text-green-800 mb-2">🎧 Audio:</h4>
                                <audio controls className="w-full">
                                  <source src={question.audioUrl} type="audio/mpeg" />
                                </audio>
                                {question.transcript && (
                                  <p className="text-sm text-gray-600 mt-2">Transcript: {question.transcript}</p>
                                )}
                              </div>
                            )}
                            
                            {/* Show image for cloze test */}
                            {question.image && (
                              <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                                <h4 className="font-semibold text-purple-800 mb-2">🖼️ Hình ảnh:</h4>
                                <img 
                                  src={question.image} 
                                  alt="Question illustration" 
                                  className="max-w-md rounded-lg border shadow-sm"
                                />
                              </div>
                            )}
                            
                            {/* Render the question */}
                            <div className="bg-white p-4 rounded-lg">
                              {question.category === 'clozetext' ? (
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                                    {qIndex + 1}. {question.question}
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {question.options.map((option, index) => {
                                      const optionLetter = getOptionLetter(index);
                                      const isSelected = selectedAnswers[key] === optionLetter;
                                      
                                      return (
                                        <button
                                          key={index}
                                          onClick={() => handleAnswerSelect(question.exerciseId, question.id, optionLetter)}
                                          className={`p-3 text-left border-2 rounded-lg transition-all duration-200 ${
                                            isSelected 
                                              ? 'border-purple-500 bg-purple-50 text-purple-800' 
                                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                          }`}
                                        >
                                          <span className="font-semibold mr-2">{optionLetter}.</span>
                                          {option}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                renderQuestion(question, qIndex, exercise.id, question.exerciseId)
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <>
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
                        {exercise.questions.map((question, qIndex) => (
                          renderQuestion(question, qIndex, exercise.id)
                        ))}
                      </div>
                    </>
                  )}
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

  // Show category selection screen or Mixed Quiz Setup
  if (showMixedQuizSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Kiểm Tra Hỗn Hợp</h1>
            <p className="text-lg text-gray-600">Chọn các loại câu hỏi muốn bao gồm trong bài kiểm tra</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-700 mb-4">Chọn loại câu hỏi:</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.keys(questionsData).map((category) => {
                  const categoryInfo = {
                    reading: { icon: '📖', title: 'Reading Comprehension' },
                    listening: { icon: '🎧', title: 'Listening' },
                    clozetext: { icon: '✏️', title: 'Cloze Test' }
                  };

                  const info = categoryInfo[category];
                  if (!info) return null;

                  return (
                    <div key={category} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={category}
                        checked={selectedCategories[category]}
                        onChange={(e) => setSelectedCategories(prev => ({
                          ...prev,
                          [category]: e.target.checked
                        }))}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor={category} className="flex items-center space-x-2 cursor-pointer">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <div className="font-medium text-gray-800">{info.title}</div>
                          <div className="text-sm text-gray-500">
                            {questionsData[category]?.length || 0} bài tập có sẵn
                          </div>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowMixedQuizSetup(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Quay lại
              </button>
              <button
                onClick={() => startMixedQuiz()}
                disabled={!Object.values(selectedCategories).some(Boolean)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:bg-gray-400"
              >
                Bắt đầu kiểm tra
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
        {/* Header with User Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-indigo-800">
              Kiểm Tra Tiếng Anh
            </h1>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">Xin chào, {user.username}</p>
                    {userStats && (
                      <p className="text-xs text-gray-600">
                        Tổng làm: {Number(userStats.totalQuestions) || 0} | Đúng: {Number(userStats.correctAnswers) || 0} | Sai: {Array.isArray(userStats.wrongAnswers) ? userStats.wrongAnswers.length : 0}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowUserStats(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
                  >
                    📊 Thống kê
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAuth(true)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
                  >
                    Đăng nhập / Đăng ký
                  </button>
                  
                  {/* Emergency clear data button */}
                  <button
                    onClick={clearAllUserData}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-2 rounded-lg text-xs transition duration-200"
                    title="Xóa dữ liệu bị lỗi"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <p className="text-lg text-gray-600">Chọn loại bài tập và số lượng câu hỏi để bắt đầu</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Quiz Mode Selection */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-gray-700 mb-4">
              Chế độ làm bài:
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStepByStepMode(true)}
                className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                  stepByStepMode
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Từng câu một
              </button>
              <button
                onClick={() => setStepByStepMode(false)}
                className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                  !stepByStepMode
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tất cả cùng lúc
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {stepByStepMode 
                ? 'Làm từng câu một, tự động chuyển câu khi chọn đáp án'
                : 'Hiển thị tất cả câu hỏi cùng lúc như trước'
              }
            </p>
          </div>

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

          {/* Number of Questions per Category */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-gray-700 mb-4">
              Số câu hỏi cho mỗi loại bài tập:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.keys(questionsData).map((category) => {
                const categoryNames = {
                  reading: 'Reading',
                  listening: 'Listening', 
                  clozetext: 'Cloze Test'
                };
                
                return (
                  <div key={category} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">
                      {categoryNames[category]}
                    </label>
                    <select
                      value={numberOfQuestions[category]}
                      onChange={(e) => setNumberOfQuestions(prev => ({
                        ...prev,
                        [category]: parseInt(e.target.value)
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                    >
                      {Array.from({length: 20}, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} câu</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Order Selection */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-gray-700 mb-4">
              Cách hiển thị câu hỏi:
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setQuestionOrder('category')}
                className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                  questionOrder === 'category'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Theo từng mục
              </button>
              <button
                onClick={() => setQuestionOrder('mixed')}
                className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                  questionOrder === 'mixed'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Lộn xộn
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {questionOrder === 'category' 
                ? 'Câu hỏi được nhóm theo từng mục Reading, Listening, Cloze Test'
                : 'Tất cả câu hỏi được trộn lẫn với nhau'
              }
            </p>
          </div>

          {/* Category Selection */}
          <div>
            <h2 className="text-lg font-medium text-gray-700 mb-4">Chọn loại bài tập:</h2>
            
            {/* Mixed Quiz Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowMixedQuizSetup(true)}
                className="w-full p-6 border-2 border-dashed border-indigo-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 text-center"
              >
                <div className="text-4xl mb-2">🔀</div>
                <h3 className="text-xl font-semibold text-indigo-600 mb-2">
                  Kiểm Tra Hỗn Hợp
                </h3>
                <p className="text-gray-600">
                  Kết hợp nhiều loại câu hỏi trong một bài kiểm tra
                </p>
              </button>
            </div>

            {/* Question Selector Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowQuestionSelector(true)}
                className="w-full p-6 border-2 border-dashed border-green-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-center"
              >
                <div className="text-4xl mb-2">🎯</div>
                <h3 className="text-xl font-semibold text-green-600 mb-2">
                  Chọn Câu Hỏi Cụ Thể
                </h3>
                <p className="text-gray-600">
                  Tự chọn những câu hỏi bạn muốn làm
                  {user && userStats?.frequentlyWrong?.length > 0 && (
                    <span className="block text-red-600 text-sm mt-1">
                      ({Array.isArray(userStats.frequentlyWrong) ? userStats.frequentlyWrong.length : 0} câu thường sai)
                    </span>
                  )}
                </p>
              </button>
            </div>
            
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

      {/* UserStats Modal */}
      {showUserStats && user && (
        <UserStats
          user={user}
          onClose={() => setShowUserStats(false)}
          onPriorityQuiz={(category, questions) => {
            startPriorityQuiz(category, questions);
          }}
        />
      )}
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
          <Route path="/" element={
            <ErrorBoundary>
              <QuizApp />
            </ErrorBoundary>
          } />
          <Route path="/admin" element={
            <ErrorBoundary>
              <AdminDashboard />
            </ErrorBoundary>
          } />
          <Route path="/admin/add" element={
            <ErrorBoundary>
              <AdminAddExercise />
            </ErrorBoundary>
          } />
          <Route path="/admin/edit/:id" element={
            <ErrorBoundary>
              <AdminAddExercise />
            </ErrorBoundary>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
