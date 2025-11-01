'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  HeadphonesIcon,
  Loader2Icon
} from 'lucide-react'
import { CornerPlusIcons } from '@/components/ui/corner-plus-icons'
import { aiApi } from '@/api'
import { useLearningStore } from '@/store'

interface LessonOutline {
  _id: string
  userId: string
  topic: string
  knowledgeLevel: string
  overallObjective: string
  totalEstimatedDuration: string
  sections: any[]
  createdAt: string
  updatedAt: string
}

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
  outline: LessonOutline
}

// Helper function to convert lesson outline to lesson display format
const convertOutlineToLesson = (outline: LessonOutline): Lesson => {
  const totalPages = outline.sections.reduce((acc, section) => acc + (section.pages?.length || 0), 0)
  
  return {
    id: outline._id,
    title: outline.topic,
    description: outline.overallObjective,
    category: outline.knowledgeLevel,
    duration: outline.totalEstimatedDuration,
    progress: 0, // Default to 0, can be tracked separately later
    status: 'not-started', // Default status
    type: 'interactive', // Default type for AI-generated lessons
    totalModules: outline.sections.length,
    completedModules: 0, // Default to 0
    outline: outline
  }
}

export default function LessonsPage() {
  const router = useRouter()
  const { setLessonOutline, setCurrentPage } = useLearningStore()
  
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'not-started'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | Lesson['type']>('all')

  // Fetch lessons on component mount
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await aiApi.getUserLessonOutlines()
        
        if (response.success && response.data) {
          const convertedLessons = response.data.map(convertOutlineToLesson)
          setLessons(convertedLessons)
        }
      } catch (err) {
        console.error('Error fetching lessons:', err)
        setError('Failed to load lessons. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLessons()
  }, [])

  const handleReviewLesson = (lesson: Lesson) => {
    // Set the lesson outline in Zustand store
    setLessonOutline(lesson.outline)
    
    // Reset to first page
    setCurrentPage(0, 0)
    
    // Navigate to lesson page
    router.push('/lesson')
  }

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
  
  // Parse duration string to get total hours (e.g., "2 hours" or "30 minutes")
  const totalHours = lessons.reduce((sum, l) => {
    const duration = l.duration.toLowerCase()
    let hours = 0
    
    // Handle "X hours Y minutes" or "X hours" or "X minutes"
    const hoursMatch = duration.match(/(\d+)\s*hour/i)
    const minutesMatch = duration.match(/(\d+)\s*minute/i)
    
    if (hoursMatch) hours += parseInt(hoursMatch[1])
    if (minutesMatch) hours += parseInt(minutesMatch[1]) / 60
    
    return sum + hours
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
          <button 
            onClick={() => router.push('/learn')}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Create Lesson
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glass-card group p-12 text-center">
            <CornerPlusIcons />
            <Loader2Icon className="w-12 h-12 text-orange-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Loading lessons...</h3>
            <p className="text-gray-500">Please wait while we fetch your lessons</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="glass-card group p-12 text-center border-red-500/20">
            <CornerPlusIcons />
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Error loading lessons</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content - Only show when not loading and no error */}
        {!isLoading && !error && (
          <>
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

              <button 
                onClick={() => handleReviewLesson(lesson)}
                className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlayIcon className="w-4 h-4" />
                Review Lesson
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
          </>
        )}
      </div>
    </div>
  )
}
