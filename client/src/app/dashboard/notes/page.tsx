'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  PlusIcon, 
  SearchIcon, 
  FileTextIcon,
  ClockIcon,
  TagIcon,
  TrashIcon,
  EditIcon,
  BookOpenIcon
} from 'lucide-react'
import { CornerPlusIcons } from '@/components/ui/corner-plus-icons'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// Sample data
const SAMPLE_NOTES: Note[] = [
  {
    id: '1',
    title: 'English Grammar - Present Perfect',
    content: 'Key points about present perfect tense: Used for actions that started in the past and continue to the present...',
    tags: ['Grammar', 'English'],
    createdAt: new Date('2024-10-28'),
    updatedAt: new Date('2024-10-28'),
  },
  {
    id: '2',
    title: 'Vocabulary - Business Terms',
    content: 'Important business vocabulary: Stakeholder, ROI, Synergy, Paradigm shift...',
    tags: ['Vocabulary', 'Business English'],
    createdAt: new Date('2024-10-27'),
    updatedAt: new Date('2024-10-27'),
  },
  {
    id: '3',
    title: 'Pronunciation Tips',
    content: 'Common pronunciation mistakes and how to fix them...',
    tags: ['Pronunciation', 'Tips'],
    createdAt: new Date('2024-10-25'),
    updatedAt: new Date('2024-10-26'),
  },
]

export default function NotesPage() {
  const [notes] = useState<Note[]>(SAMPLE_NOTES)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="dashboard-content">
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Notes</h1>
            <p className="text-gray-400">Keep track of your learning notes</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2 cursor-pointer">
            <PlusIcon className="w-4 h-4" />
            New Note
          </button>
        </div>

        {/* Search Bar */}
        <div className="glass-card group p-4">
          <CornerPlusIcons />
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="glass-card group p-6 hover:border-orange-500/30 transition-all cursor-pointer">
              <CornerPlusIcons />
              
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-orange-400">
                  <FileTextIcon className="w-5 h-5" />
                  <h3 className="font-semibold text-gray-100 text-lg">{note.title}</h3>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                {note.content}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {note.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-700 pt-3">
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  {note.updatedAt.toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <button className="p-1 hover:text-orange-400 transition-colors cursor-pointer">
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:text-red-400 transition-colors cursor-pointer">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="glass-card group p-12 text-center">
            <CornerPlusIcons />
            <BookOpenIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No notes found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search query' 
                : 'Start by creating your first note'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
