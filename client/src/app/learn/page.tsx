
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLearningStore } from '@/store';
import { useAuthStore } from '@/store';
import { aiApi } from '@/api';
import { Tiles } from '@/components/ui/tiles';
import { AnimatedGroup } from '@/components/ui/animated-group';

const LearnPage = () => {
  const router = useRouter();
  const [localTopic, setLocalTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get actions from Zustand store
  const { setTopic, setQuestions, setIsLoadingQuestions, reset } = useLearningStore();
  const { user } = useAuthStore();

  // Topic suggestions
  const suggestions = [
    { topic: 'Python Programming', icon: '🐍', category: 'Programming', visits: 'You visit often' },
    { topic: 'Calculus', icon: '📐', category: 'Mathematics', visits: 'You visited 3 days ago' },
    { topic: 'World History', icon: '🌍', category: 'History', visits: 'You visited 1 week ago' },
    { topic: 'Chemistry', icon: '🧪', category: 'Science', visits: 'You visited 2 weeks ago' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localTopic.trim()) {
      setIsLoading(true);
      setError(null);
      setIsLoadingQuestions(true);
      
      try {
        // Clear the learning store before starting a new topic
        reset();
        
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
    <div className="relative min-h-screen flex flex-col bg-[#0A0B09] overflow-hidden">
      {/* Animated Tiles Background */}
      <div className="fixed inset-0 z-0 opacity-60">
        <Tiles 
          rows={50} 
          cols={20}
          tileSize="md"
          tileClassName="border-[#bf3a0d]/50"
        />
      </div>

      {/* Header */}
      <header className="hero-header">
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0,
                },
              },
            },
            item: {
              hidden: {
                opacity: 0,
                y: -20,
              },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  type: 'spring' as const,
                  bounce: 0.4,
                  duration: 1,
                },
              },
            },
          }}
          className="w-full flex justify-between items-center"
        >
          <div>
            <Link href="/" className="hero-brand">
              <span>Mindly</span>
            </Link>
          </div>
          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/chat">
                  <button className="hero-cta" type="button">
                    Chat with AI
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className="hero-cta" type="button">
                    Dashboard
                  </button>
                </Link>
              </div>
            ) : (
              <Link href="/login">
                <button className="hero-cta" type="button">
                  Login now
                </button>
              </Link>
            )}
          </div>
        </AnimatedGroup>
      </header>
      
      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex items-center justify-center p-4 pointer-events-auto mt-24">
        {/* Main Card */}
        <div className="bg-[#0A0B09] p-8 sm:p-12 rounded-lg border border-[#bf3a0d]/30">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#ffffff] mb-3">
              What do you want to learn?
            </h1>
            <p className="text-[#ffffff]/70 text-lg">
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
                className="w-full px-6 py-4 text-lg border-2 border-[#bf3a0d]/30 bg-[#141712] text-[#ffffff] rounded-xl focus:border-[#bf3a0d] focus:ring-2 focus:ring-[#bf3a0d]/50 outline-none transition-all duration-200 placeholder:text-[#ffffff]/40"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-[#bf3a0d]/10 border border-[#bf3a0d] rounded-xl">
                <p className="text-[#bf3a0d] text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!localTopic.trim() || isLoading}
              className="w-full cursor-pointer py-4 px-6 bg-[#bf3a0d] text-[#ffffff] text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-[#bf3a0d]/90 disabled:bg-[#ffffff]/20 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 active:scale-[0.98]"
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

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#ffffff]/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0A0B09] text-[#ffffff]/50">or</span>
            </div>
          </div>

          {/* Upload Document Option */}
          <Link href="/studybynotes">
            <button
              type="button"
              disabled={isLoading}
              className="w-full cursor-pointer py-4 px-6 bg-[#141712] text-[#ffffff] text-lg font-semibold rounded-xl border-2 border-[#bf3a0d]/30 hover:border-[#bf3a0d] hover:bg-[#bf3a0d]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Your Own Document
            </button>
          </Link>

          {/* Suggestions - Continue with these topics */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[#ffffff] font-medium">Continue with these topics</p>
              <button className="text-[#ffffff]/40 hover:text-[#ffffff]/60">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                  <circle cx="3" cy="8" r="1.5"/>
                  <circle cx="8" cy="8" r="1.5"/>
                  <circle cx="13" cy="8" r="1.5"/>
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {suggestions.map((item) => (
                <button
                  key={item.topic}
                  onClick={() => setLocalTopic(item.topic)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-[#bf3a0d]/10 border border-transparent hover:border-[#bf3a0d]/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left group cursor-pointer"
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#ffffff]/5 rounded-lg text-xl group-hover:bg-[#bf3a0d]/20 transition-all duration-200">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#ffffff] truncate">{item.topic}</h3>
                    <p className="text-xs text-[#ffffff]/50">
                      {item.category} • {item.visits}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;