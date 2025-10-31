'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  PlusIcon, 
  SearchIcon, 
  NotebookIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrendingUpIcon,
  PlayIcon,
  AwardIcon
} from 'lucide-react'
import { CornerPlusIcons } from '@/components/ui/corner-plus-icons'

interface Quiz {
  id: string
  title: string
  topic: string
  questions: number
  duration: string
  score?: number
  status: 'completed' | 'in-progress' | 'not-started'
  completedAt?: Date
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

// Sample data
const SAMPLE_QUIZZES: Quiz[] = [
  {
    id: '1',
    title: 'English Grammar Basics',
    topic: 'Grammar',
    questions: 15,
    duration: '20 min',
    score: 87,
    status: 'completed',
    completedAt: new Date('2024-10-28'),
    difficulty: 'Easy',
  },
  {
    id: '2',
    title: 'Business Vocabulary Test',
    topic: 'Vocabulary',
    questions: 20,
    duration: '25 min',
    score: 92,
    status: 'completed',
    completedAt: new Date('2024-10-27'),
    difficulty: 'Medium',
  },
  {
    id: '3',
    title: 'Advanced Pronunciation',
    topic: 'Pronunciation',
    questions: 12,
    duration: '15 min',
    status: 'in-progress',
    difficulty: 'Hard',
  },
  {
    id: '4',
    title: 'Present Perfect Tense',
    topic: 'Grammar',
    questions: 10,
    duration: '15 min',
    status: 'not-started',
    difficulty: 'Medium',
  },
]

export default function QuizzesPage() {
  const [quizzes] = useState<Quiz[]>(SAMPLE_QUIZZES)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'not-started'>('all')

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quiz.topic.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || quiz.status === filter
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: Quiz['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'in-progress':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'not-started':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getDifficultyColor = (difficulty: Quiz['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'Medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'Hard':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
    }
  }

  const completedQuizzes = quizzes.filter(q => q.status === 'completed')
  const averageScore = completedQuizzes.length > 0
    ? Math.round(completedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / completedQuizzes.length)
    : 0

  return (
    <div className="dashboard-content">
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Quizzes</h1>
            <p className="text-gray-400">Test your knowledge and track your progress</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2 cursor-pointer">
            <PlusIcon className="w-4 h-4" />
            Create Quiz
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card group p-4">
            <CornerPlusIcons />
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <NotebookIcon className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Quizzes</p>
                <p className="text-2xl font-bold text-gray-100">{quizzes.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card group p-4">
            <CornerPlusIcons />
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-gray-100">{completedQuizzes.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card group p-4">
            <CornerPlusIcons />
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <AwardIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Average Score</p>
                <p className="text-2xl font-bold text-gray-100">{averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="glass-card group p-4">
            <CornerPlusIcons />
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <TrendingUpIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-gray-100">
                  {quizzes.filter(q => q.status === 'in-progress').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="glass-card group p-4">
          <CornerPlusIcons />
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'completed', 'in-progress', 'not-started'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={cn(
                    'px-4 py-2 rounded-lg border transition-all capitalize cursor-pointer',
                    filter === status
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                  )}
                >
                  {status.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quizzes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="glass-card group p-6 hover:border-orange-500/30 transition-all">
              <CornerPlusIcons />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 text-orange-400">
                  <NotebookIcon className="w-5 h-5" />
                  <h3 className="font-semibold text-gray-100 text-lg">{quiz.title}</h3>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <span className={cn('px-2 py-1 border rounded text-xs', getStatusColor(quiz.status))}>
                  {quiz.status.replace('-', ' ')}
                </span>
                <span className={cn('px-2 py-1 border rounded text-xs', getDifficultyColor(quiz.difficulty))}>
                  {quiz.difficulty}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Topic:</span>
                  <span className="text-gray-300">{quiz.topic}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Questions:</span>
                  <span className="text-gray-300">{quiz.questions}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  <span className="text-gray-300">{quiz.duration}</span>
                </div>
              </div>

              {quiz.score !== undefined && (
                <div className="mb-4 p-3 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Last Score</span>
                    <span className="text-xl font-bold text-orange-400">{quiz.score}%</span>
                  </div>
                </div>
              )}

              <button className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <PlayIcon className="w-4 h-4" />
                {quiz.status === 'completed' ? 'Retake Quiz' : quiz.status === 'in-progress' ? 'Continue' : 'Start Quiz'}
              </button>
            </div>
          ))}
        </div>

        {filteredQuizzes.length === 0 && (
          <div className="glass-card group p-12 text-center">
            <CornerPlusIcons />
            <NotebookIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No quizzes found</h3>
            <p className="text-gray-500">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters or search query' 
                : 'Start by creating your first quiz'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
