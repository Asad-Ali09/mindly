
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLearningStore } from '@/store';
import { aiApi } from '@/api';

const LearnPage = () => {
  const router = useRouter();
  const [localTopic, setLocalTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get actions from Zustand store
  const { setTopic, setQuestions, setIsLoadingQuestions } = useLearningStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localTopic.trim()) {
      setIsLoading(true);
      setError(null);
      setIsLoadingQuestions(true);
      
      try {
        // Save topic to store
        setTopic(localTopic.trim());
        
        // Fetch assessment questions
        const response = await aiApi.getAssessmentQuestions(localTopic.trim());
        
        if (response.success) {
          // Save questions to store
          setQuestions(response.data.questions);
          console.log('Questions saved to store:', response.data.questions);
          // Navigate to questions page
          router.push('/questions');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch questions. Please try again.';
        setError(errorMessage);
        console.error('Error fetching questions:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingQuestions(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-3">
              What do you want to learn?
            </h1>
            <p className="text-gray-600 text-lg">
              Enter any topic and we'll create a personalized learning experience for you
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                value={localTopic}
                onChange={(e) => setLocalTopic(e.target.value)}
                placeholder="e.g., Machine Learning, Quantum Physics, Spanish Language..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 placeholder:text-gray-400"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!localTopic.trim() || isLoading}
              className="w-full cursor-pointer py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                'Start Learning'
              )}
            </button>
          </form>

          {/* Suggestions */}
          <div className="mt-8">
            <p className="text-sm text-gray-500 mb-3 text-center">Popular topics:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Python Programming', 'Calculus', 'World History', 'Chemistry'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setLocalTopic(suggestion)}
                  disabled={isLoading}
                  className="px-4 py-2 cursor-pointer text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Powered by AI • Personalized learning paths • Interactive lessons
        </p>
      </div>
    </div>
  );
};

export default LearnPage;