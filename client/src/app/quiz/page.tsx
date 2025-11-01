'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tiles } from '@/components/ui/tiles';
import { quizApi, Quiz as QuizType, QuizQuestion as ApiQuizQuestion } from '@/api/quiz.api';
import { useLearningStore } from '@/store/learningStore';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

// Dummy quiz data
const DUMMY_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is the derivative of x²?',
    options: ['x', '2x', 'x²', '2'],
    correctAnswer: '2x'
  },
  {
    id: 'q2',
    question: 'What is the integral of 2x?',
    options: ['x²', 'x² + C', '2', '2x + C'],
    correctAnswer: 'x² + C'
  },
  {
    id: 'q3',
    question: 'What is the limit of (x² - 1)/(x - 1) as x approaches 1?',
    options: ['0', '1', '2', 'undefined'],
    correctAnswer: '2'
  },
  {
    id: 'q4',
    question: 'Which of the following is a continuous function?',
    options: ['f(x) = 1/x', 'f(x) = |x|', 'f(x) = floor(x)', 'f(x) = tan(x)'],
    correctAnswer: 'f(x) = |x|'
  },
  {
    id: 'q5',
    question: 'What is the derivative of sin(x)?',
    options: ['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'],
    correctAnswer: 'cos(x)'
  },
  {
    id: 'q6',
    question: 'What is the second derivative of x³?',
    options: ['3x²', '6x', '3x', 'x²'],
    correctAnswer: '6x'
  },
  {
    id: 'q7',
    question: 'What is the integral of 1/x?',
    options: ['x', 'ln|x| + C', '1/x²', '-1/x² + C'],
    correctAnswer: 'ln|x| + C'
  },
  {
    id: 'q8',
    question: 'What is the chain rule for derivatives?',
    options: ['d/dx[f(g(x))] = f\'(x)g\'(x)', 'd/dx[f(g(x))] = f\'(g(x))g\'(x)', 'd/dx[f(g(x))] = f(g\'(x))', 'd/dx[f(g(x))] = f\'(x) + g\'(x)'],
    correctAnswer: 'd/dx[f(g(x))] = f\'(g(x))g\'(x)'
  },
  {
    id: 'q9',
    question: 'What is the fundamental theorem of calculus?',
    options: ['It relates differentiation and integration', 'It defines limits', 'It proves continuity', 'It defines derivatives'],
    correctAnswer: 'It relates differentiation and integration'
  },
  {
    id: 'q10',
    question: 'What is the derivative of e^x?',
    options: ['e^x', 'xe^(x-1)', 'e', 'ln(x)'],
    correctAnswer: 'e^x'
  }
];

const QuizPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPage = useLearningStore((state) => state.nextPage);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<ApiQuizQuestion[]>(DUMMY_QUIZ.map((q, idx) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: ''
  })));

  // Get query params
  const lessonOutlineId = searchParams.get('lessonOutlineId');
  const sectionId = searchParams.get('sectionId');
  const sectionIndex = searchParams.get('sectionIndex');

  // Fetch quiz when component mounts
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!lessonOutlineId || !sectionId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Try to get existing quiz first
        let quizData: QuizType;
        try {
          quizData = await quizApi.getQuizBySection(lessonOutlineId, sectionId);
        } catch (err: any) {
          // If quiz doesn't exist, generate it
          if (err.response?.status === 404 || err.message?.includes('not found')) {
            quizData = await quizApi.generateQuiz(lessonOutlineId, sectionId);
          } else {
            throw err;
          }
        }

        setQuiz(quizData);
        setQuizQuestions(quizData.questions);
      } catch (err: any) {
        console.error('Error fetching quiz:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [lessonOutlineId, sectionId, sectionIndex]);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const currentAnswer = userAnswers[currentQuestion?.id];
  const isAnswered = currentAnswer !== undefined;

  // Check if all questions are answered
  const allQuestionsAnswered = quizQuestions.every(
    (q) => userAnswers[q.id] !== undefined
  );

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    if (showResults) return; // Prevent changes after submission
    
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: option
    });
  };

  // Handle next question
  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Handle previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!allQuestionsAnswered || !quiz) return;

    try {
      // Submit quiz to API - answers is already in the correct format (Record<string, string>)
      const result = await quizApi.submitQuiz(quiz._id, userAnswers);

      // Update UI with results
      setScore(result.score);
      setShowResults(true);
      setCurrentQuestionIndex(0);
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit quiz');
    }
  };

  // Handle continue to next section after completing quiz
  const handleContinue = () => {
    // Move to next section in the store
    nextPage();
    // Navigate back to lesson page
    router.push('/lesson');
  };

  // Get option status for results view
  const getOptionStatus = (questionId: string, option: string) => {
    if (!showResults) return 'default';
    
    const question = quizQuestions.find(q => q.id === questionId);
    if (!question) return 'default';
    
    const userAnswer = userAnswers[questionId];
    const isCorrectAnswer = option === question.correctAnswer;
    const isUserAnswer = option === userAnswer;
    
    if (isCorrectAnswer) return 'correct';
    if (isUserAnswer && !isCorrectAnswer) return 'incorrect';
    return 'default';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#141712] p-4 py-8 overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0 opacity-60">
          <Tiles 
            rows={50} 
            cols={20}
            tileSize="md"
            tileClassName="border-[#bf3a0d]/50"
          />
        </div>
        <div className="relative z-10 text-[#ffffff] text-xl">Loading quiz...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative min-h-screen bg-[#141712] p-4 py-8 overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0 opacity-60">
          <Tiles 
            rows={50} 
            cols={20}
            tileSize="md"
            tileClassName="border-[#bf3a0d]/50"
          />
        </div>
        <div className="relative z-10 max-w-md text-center">
          <h2 className="text-2xl font-bold text-[#ffffff] mb-4">Error</h2>
          <p className="text-[#ffffff]/70 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-xl hover:bg-[#bf3a0d]/90 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No questions state
  if (!currentQuestion || quizQuestions.length === 0) {
    return (
      <div className="relative min-h-screen bg-[#141712] p-4 py-8 overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0 opacity-60">
          <Tiles 
            rows={50} 
            cols={20}
            tileSize="md"
            tileClassName="border-[#bf3a0d]/50"
          />
        </div>
        <div className="relative z-10 text-[#ffffff] text-xl">No quiz questions available</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#141712] p-4 py-8 overflow-hidden">
      {/* Animated Tiles Background */}
      <div className="fixed inset-0 z-0 opacity-60">
        <Tiles 
          rows={50} 
          cols={20}
          tileSize="md"
          tileClassName="border-[#bf3a0d]/50"
        />
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Main Card Container */}
        <div className="bg-[#141712] border border-[#bf3a0d]/30 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#ffffff] mb-2">
              {showResults ? 'Quiz Results' : 'Section Quiz'}
            </h1>
            <p className="text-[#ffffff]/70">
              {showResults 
                ? `You scored ${score} out of ${quizQuestions.length} (${Math.round((score / quizQuestions.length) * 100)}%)`
                : 'Test your knowledge of this section'
              }
            </p>
          </div>

          {/* Results Summary */}
          {showResults && (
            <div className="mb-8 p-6 bg-[#bf3a0d]/10 border border-[#bf3a0d]/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#ffffff] mb-2">
                    {score >= Math.ceil(quizQuestions.length * 0.7) ? '🎉 Excellent!' : score >= Math.ceil(quizQuestions.length * 0.5) ? '👍 Good Job!' : '📚 Keep Practicing!'}
                  </h3>
                  <p className="text-[#ffffff]/70">
                    {score >= Math.ceil(quizQuestions.length * 0.7)
                      ? 'You have a strong understanding of this section!' 
                      : score >= Math.ceil(quizQuestions.length * 0.5)
                      ? 'You\'re on the right track. Review the questions you missed.' 
                      : 'Consider reviewing the material and trying again.'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-[#bf3a0d]">{score}/{quizQuestions.length}</div>
                  <div className="text-sm text-[#ffffff]/50 mt-1">Score</div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {!showResults && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#ffffff]">
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
                <span className="text-sm font-medium text-[#ffffff]">
                  {Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-[#ffffff]/10 rounded-full h-2.5">
                <div
                  className="bg-[#bf3a0d] h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Question Section */}
          <div className="mb-6">
            {/* Question Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="text-xl sm:text-2xl font-semibold text-[#ffffff]">
                  {currentQuestion.question}
                </h2>
                {showResults && (
                  <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                    userAnswers[currentQuestion.id] === currentQuestion.correctAnswer
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {userAnswers[currentQuestion.id] === currentQuestion.correctAnswer ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentAnswer === option;
                const status = getOptionStatus(currentQuestion.id, option);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(option)}
                    disabled={showResults}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      status === 'correct'
                        ? 'border-green-500 bg-green-500/10'
                        : status === 'incorrect'
                        ? 'border-red-500 bg-red-500/10'
                        : isSelected
                        ? 'border-[#bf3a0d] bg-[#bf3a0d]/10 shadow-md'
                        : 'border-[#ffffff]/20 hover:border-[#bf3a0d]/50 hover:bg-[#ffffff]/5'
                    } ${showResults ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Radio button */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          status === 'correct'
                            ? 'border-green-500 bg-green-500'
                            : status === 'incorrect'
                            ? 'border-red-500 bg-red-500'
                            : isSelected
                            ? 'border-[#bf3a0d]'
                            : 'border-[#ffffff]/30'
                        }`}
                      >
                        {(isSelected || status === 'correct') && (
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'correct' ? 'bg-white' : status === 'incorrect' ? 'bg-white' : 'bg-[#bf3a0d]'
                          }`}></div>
                        )}
                      </div>
                      <span className={`flex-1 ${
                        status === 'correct'
                          ? 'text-green-400 font-medium'
                          : status === 'incorrect'
                          ? 'text-red-400 font-medium'
                          : isSelected
                          ? 'text-[#bf3a0d] font-medium'
                          : 'text-[#ffffff]'
                      }`}>
                        {option}
                      </span>
                      {status === 'correct' && (
                        <span className="text-green-400">✓</span>
                      )}
                      {status === 'incorrect' && (
                        <span className="text-red-400">✗</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation for results */}
            {showResults && userAnswers[currentQuestion.id] !== currentQuestion.correctAnswer && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-sm text-green-400 mb-2">
                  <strong>Correct Answer:</strong> {currentQuestion.correctAnswer}
                </p>
                {currentQuestion.explanation && (
                  <p className="text-sm text-green-400">
                    <strong>Explanation:</strong> {currentQuestion.explanation}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 bg-[#ffffff]/10 text-[#ffffff] font-semibold rounded-xl hover:bg-[#ffffff]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>

            <div className="flex-1"></div>

            {/* Next/Submit/Retake Button */}
            {showResults ? (
              <>
                {currentQuestionIndex < quizQuestions.length - 1 && (
                  <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-[#bf3a0d]/90 transition-all duration-200"
                  >
                    Next
                  </button>
                )}
                {currentQuestionIndex === quizQuestions.length - 1 && (
                  <button
                    onClick={handleContinue}
                    className="px-8 py-3 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-[#bf3a0d]/90 transition-all duration-200"
                  >
                    Continue to Next Section
                  </button>
                )}
              </>
            ) : currentQuestionIndex < quizQuestions.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isAnswered}
                className="px-8 py-3 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-[#bf3a0d]/90 disabled:bg-[#ffffff]/20 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered}
                className="px-8 py-3 bg-[#bf3a0d] text-[#ffffff] font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-[#bf3a0d]/90 disabled:bg-[#ffffff]/20 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
              >
                Submit Quiz
              </button>
            )}
          </div>

          {/* Question Navigation Dots */}
          <div className="mt-8 flex justify-center gap-2 flex-wrap">
            {quizQuestions.map((q, index) => {
              const isAnsweredQ = userAnswers[q.id] !== undefined;
              const isCurrent = index === currentQuestionIndex;
              const isCorrect = showResults && userAnswers[q.id] === q.correctAnswer;
              const isIncorrect = showResults && userAnswers[q.id] !== q.correctAnswer && isAnsweredQ;
              
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    isCurrent
                      ? 'bg-[#bf3a0d] text-white ring-4 ring-[#bf3a0d]/30'
                      : isCorrect
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : isIncorrect
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : isAnsweredQ
                      ? 'bg-[#bf3a0d]/70 text-white hover:bg-[#bf3a0d]'
                      : 'bg-[#ffffff]/10 text-[#ffffff] hover:bg-[#ffffff]/20'
                  }`}
                  title={`Question ${index + 1}${isAnsweredQ ? ' (Answered)' : ''}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function QuizPageWrapper() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen bg-[#141712] p-4 py-8 overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0 opacity-60">
          <Tiles 
            rows={50} 
            cols={20}
            tileSize="md"
            tileClassName="border-[#bf3a0d]/50"
          />
        </div>
        <div className="relative z-10 text-[#ffffff] text-xl">Loading...</div>
      </div>
    }>
      <QuizPage />
    </Suspense>
  );
}
