'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  PlusIcon, 
  SearchIcon, 
  GraduationCapIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  BookOpenIcon,
  VideoIcon,
  FileTextIcon,
  HeadphonesIcon
} from 'lucide-react'
import { CornerPlusIcons } from '@/components/ui/corner-plus-icons'

interface Lesson {
  id: string
  title: string
  description: string
  category: string
  duration: string
  progress: number
  status: 'completed' | 'in-progress' | 'not-started'
  type: 'video' | 'reading' | 'audio' | 'interactive'
  completedAt?: Date
  totalModules: number
  completedModules: number
}

// Sample data
const SAMPLE_LESSONS: Lesson[] = [
  {
    id: '1',
    title: 'English Grammar Fundamentals',
    description: 'Master the basics of English grammar including tenses, sentence structure, and parts of speech.',
    category: 'Grammar',
    duration: '2h 30m',
    progress: 85,
    status: 'in-progress',
    type: 'video',
    totalModules: 12,
    completedModules: 10,
  },
  {
    id: '2',
    title: 'Business English Communication',
    description: 'Learn professional communication skills for business environments, emails, and presentations.',
    category: 'Business English',
    duration: '3h 15m',
    progress: 100,
    status: 'completed',
    type: 'interactive',
    completedAt: new Date('2024-10-25'),
    totalModules: 15,
    completedModules: 15,
  },
  {
    id: '3',
    title: 'Pronunciation Practice',
    description: 'Improve your English pronunciation with guided exercises and audio examples.',
    category: 'Pronunciation',
    duration: '1h 45m',
    progress: 60,
    status: 'in-progress',
    type: 'audio',
    totalModules: 10,
    completedModules: 6,
  },
  {
    id: '4',
    title: 'Advanced Vocabulary Building',
    description: 'Expand your vocabulary with advanced words and phrases for academic and professional contexts.',
    category: 'Vocabulary',
    duration: '2h 0m',
    progress: 0,
    status: 'not-started',
    type: 'reading',
    totalModules: 8,
    completedModules: 0,
  },
  {
    id: '5',
    title: 'Conversational English',
    description: 'Practice everyday conversations, idioms, and colloquial expressions.',
    category: 'Speaking',
    duration: '2h 20m',
    progress: 100,
    status: 'completed',
    type: 'video',
    completedAt: new Date('2024-10-20'),
    totalModules: 10,
    completedModules: 10,
  },
  {
    id: '6',
    title: 'Writing Skills Mastery',
    description: 'Develop your writing skills for essays, reports, and creative writing.',
    category: 'Writing',
    duration: '3h 0m',
    progress: 30,
    status: 'in-progress',
    type: 'interactive',
    totalModules: 14,
    completedModules: 4,
  },
]

export default function LessonsPage() {
  const [lessons] = useState<Lesson[]>(SAMPLE_LESSONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'not-started'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | Lesson['type']>('all')

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lesson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lesson.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || lesson.status === filter
    const matchesType = typeFilter === 'all' || lesson.type === typeFilter
    return matchesSearch && matchesFilter && matchesType
  })

  const getStatusColor = (status: Lesson['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'in-progress':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'not-started':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getTypeIcon = (type: Lesson['type']) => {
    switch (type) {
      case 'video':
        return <VideoIcon className="w-4 h-4" />
      case 'reading':
        return <FileTextIcon className="w-4 h-4" />
      case 'audio':
        return <HeadphonesIcon className="w-4 h-4" />
      case 'interactive':
        return <BookOpenIcon className="w-4 h-4" />
    }
  }

  const completedLessons = lessons.filter(l => l.status === 'completed')
  const inProgressLessons = lessons.filter(l => l.status === 'in-progress')
  const totalHours = lessons.reduce((sum, l) => {
    const [hours, mins] = l.duration.split(' ')
    return sum + parseInt(hours) + (parseInt(mins) / 60)
  }, 0)

  return (
    <div className="dashboard-content">
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Lessons</h1>
            <p className="text-gray-400">Continue your learning journey</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2 cursor-pointer">
            <PlusIcon className="w-4 h-4" />
            Create Lesson
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card group p-4">
            <CornerPlusIcons />
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <GraduationCapIcon className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Lessons</p>
                <p className="text-2xl font-bold text-gray-100">{lessons.length}</p>
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
                <p className="text-2xl font-bold text-gray-100">{completedLessons.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card group p-4">
            <CornerPlusIcons />
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <PlayIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-gray-100">{inProgressLessons.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card group p-4">
            <CornerPlusIcons />
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <ClockIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-gray-100">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="glass-card group p-4">
          <CornerPlusIcons />
          <div className="flex flex-col gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <span className="text-gray-400 text-sm self-center mr-2">Status:</span>
                {(['all', 'in-progress', 'completed', 'not-started'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border transition-all capitalize text-sm cursor-pointer',
                      filter === status
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                    )}
                  >
                    {status.replace('-', ' ')}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 ml-4">
                <span className="text-gray-400 text-sm self-center mr-2">Type:</span>
                {(['all', 'video', 'reading', 'audio', 'interactive'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border transition-all capitalize text-sm cursor-pointer',
                      typeFilter === type
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLessons.map((lesson) => (
            <div key={lesson.id} className="glass-card group p-6 hover:border-orange-500/30 transition-all">
              <CornerPlusIcons />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCapIcon className="w-5 h-5 text-orange-400" />
                    <h3 className="font-semibold text-gray-100 text-lg">{lesson.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{lesson.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={cn('px-2 py-1 border rounded text-xs flex items-center gap-1', getStatusColor(lesson.status))}>
                  {lesson.status.replace('-', ' ')}
                </span>
                <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400 flex items-center gap-1">
                  {getTypeIcon(lesson.type)}
                  {lesson.type}
                </span>
                <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-400">
                  {lesson.category}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-orange-400 font-semibold">{lesson.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                    style={{ width: `${lesson.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{lesson.completedModules}/{lesson.totalModules} modules</span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {lesson.duration}
                  </span>
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <PlayIcon className="w-4 h-4" />
                {lesson.status === 'completed' ? 'Review Lesson' : lesson.status === 'in-progress' ? 'Continue Learning' : 'Start Lesson'}
              </button>
            </div>
          ))}
        </div>

        {filteredLessons.length === 0 && (
          <div className="glass-card group p-12 text-center">
            <CornerPlusIcons />
            <GraduationCapIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No lessons found</h3>
            <p className="text-gray-500">
              {searchQuery || filter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters or search query' 
                : 'Start by creating your first lesson'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
