
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLearningStore } from '@/store';
import { aiApi } from '@/api';

const QuestionsPage = () => {
  const router = useRouter();
  const {
    topic,
    questions,
    responses,
    setResponse,
    setLessonOutline,
    isLoadingOutline,
    setIsLoadingOutline,
  } = useLearningStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Redirect to /learn if no questions
  useEffect(() => {
    if (questions.length === 0) {
      router.push('/learn');
    }
  }, [questions, router]);

  // Check if current question is answered
  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = currentQuestion ? responses[currentQuestion.id] : undefined;
  const isAnswered = currentResponse && currentResponse.length > 0;

  // Check if all questions are answered
  const allQuestionsAnswered = questions.every(
    (q) => responses[q.id] && responses[q.id].length > 0
  );

  // Helper to get option text
  const getOptionText = (option: string | { id: string; text: string }): string => {
    return typeof option === 'string' ? option : option.text;
  };

  // Helper to get option id
  const getOptionId = (option: string | { id: string; text: string }): string => {
    return typeof option === 'string' ? option : option.id;
  };

  // Handle option selection
  const handleOptionSelect = (option: string | { id: string; text: string }) => {
    if (!currentQuestion) return;

    const optionId = getOptionId(option);
    const currentAnswers = responses[currentQuestion.id] || [];
    const isSingleChoice = currentQuestion.type === 'single';
    
    if (isSingleChoice) {
      // For single choice, replace the selection
      if (currentAnswers.includes(optionId)) {
        // Deselect if clicking the same option
        setResponse(currentQuestion.id, []);
      } else {
        // Select the new option (replacing any previous selection)
        setResponse(currentQuestion.id, [optionId]);
      }
    } else {
      // For multiple choice, toggle selection
      if (currentAnswers.includes(optionId)) {
        // Remove option
        const newAnswers = currentAnswers.filter((ans) => ans !== optionId);
        setResponse(currentQuestion.id, newAnswers);
      } else {
        // Add option
        setResponse(currentQuestion.id, [...currentAnswers, optionId]);
      }
    }
  };

  // Handle next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setError(null);
    }
  };

  // Handle previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setError(null);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!allQuestionsAnswered) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setIsLoadingOutline(true);
    setError(null);

    try {
      // Call API to get lesson outline
      const response = await aiApi.getLessonOutline({
        topic,
        responses,
        questions,
      });

      if (response.success) {
        // Save outline to store
        setLessonOutline(response.data);
        console.log('Lesson outline saved to store:', response.data);
        
        // Redirect to lesson page
        router.push('/lesson');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate lesson outline. Please try again.';
      setError(errorMessage);
      console.error('Error generating lesson outline:', err);
    } finally {
      setIsLoadingOutline(false);
    }
  };

  // Show loading if redirecting
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Assessment: {topic}
          </h1>
          <p className="text-gray-600">
            Answer these questions to help us personalize your learning experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 mb-6">
          {/* Question Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                {currentQuestion.question}
              </h2>
              <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                currentQuestion.type === 'single'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {currentQuestion.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const optionId = getOptionId(option);
              const optionText = getOptionText(option);
              const isSelected = currentResponse?.includes(optionId);
              const isSingleChoice = currentQuestion.type === 'single';
              
              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Radio button for single choice, checkbox for multiple */}
                    {isSingleChoice ? (
                      // Radio button
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    ) : (
                      // Checkbox
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                    )}
                    <span className={`${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                      {optionText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hint based on question type */}
          <p className="text-sm text-gray-500 mt-4 italic">
            {currentQuestion.type === 'single' 
              ? 'Select one option' 
              : 'Select all that apply'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Previous
          </button>

          <div className="flex-1"></div>

          {/* Next/Submit Button */}
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered || isLoadingOutline}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
            >
              {isLoadingOutline ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Lesson...
                </span>
              ) : (
                'Submit & Continue'
              )}
            </button>
          )}
        </div>

        {/* Question Navigation Dots */}
        <div className="mt-8 flex justify-center gap-2 flex-wrap">
          {questions.map((q, index) => {
            const isAnsweredQ = responses[q.id] && responses[q.id].length > 0;
            const isCurrent = index === currentQuestionIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                    : isAnsweredQ
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
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
  );
};

export default QuestionsPage;