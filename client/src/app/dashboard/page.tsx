'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import './dashboard.css'
import { motion } from 'framer-motion'
import {
  BarChart3Icon,
  SearchIcon,
  FilterIcon,
  ChevronDownIcon,
  HomeIcon,
  VideoIcon,
  MessageSquareIcon,
  CheckSquareIcon,
  TagIcon,
  TrendingUpIcon,
  UsersIcon,
  ClockIcon,
  MicIcon,
  BookOpenIcon,
  PlayIcon,
  AlertTriangleIcon,
  AwardIcon,
  ZapIcon,
  TrendingDownIcon,
  Download,
  ExternalLinkIcon,
  NotebookIcon,
  FileTextIcon,
  GraduationCapIcon,
} from 'lucide-react'
import { CornerPlusIcons } from '@/components/ui/corner-plus-icons'
import { ActivityChartCard } from '@/components/ui/activity-chart-card'

// Sample Data for Activity Chart (Weekly hours data)
const ACTIVITY_DATA = [
  { day: 'Mon', value: 8 },
  { day: 'Tue', value: 12 },
  { day: 'Wed', value: 9 },
  { day: 'Thu', value: 4 },
  { day: 'Fri', value: 14 },
  { day: 'Sat', value: 7 },
  { day: 'Sun', value: 2 },
]

// Legacy chart data (can be removed if not used elsewhere)
const CHART_DATA = [10, 18, 24, 30, 48, 28, 26, 22, 34, 30]
const PLATFORMS = [
  { name: 'Google Meet', progress: 0.8, value: 80, icon: '🎥' },
  { name: 'Zoom', progress: 0.6, value: 60, icon: '📹' },
  { name: 'MS Teams', progress: 0.5, value: 50, icon: '💼' },
]
const SENTIMENTS = [
  { label: 'Positive', value: 34, color: '#ff6b3d' },
  { label: 'Negative', value: 21, color: '#ff7a80' },
  { label: 'Neutral', value: 45, color: '#bf3a0d' },
]
const TIME_SPENT_DATA = [
  { name: 'Elina Lopez', role: 'Web Designer', time: '40h 10m', hours: 40.16, avatar: '👩‍💼' },
  { name: 'Marcus Chen', role: 'Product Manager', time: '35h 30m', hours: 35.5, avatar: '👨‍💼' },
  { name: 'Sarah Kim', role: 'UX Researcher', time: '28h 45m', hours: 28.75, avatar: '👩‍🎨' },
]
const TALK_LISTEN_DATA = [
  { name: 'Elina Lopez', role: 'Web Designer', talk: 80, listen: 20, time: '40h 10m', avatar: '👩‍💼' },
  { name: 'Marcus Chen', role: 'Product Manager', talk: 60, listen: 40, time: '35h 30m', avatar: '👨‍💼' },
  { name: 'Sarah Kim', role: 'UX Researcher', talk: 45, listen: 55, time: '28h 45m', avatar: '👩‍🎨' },
]

export default function DashboardPage() {
  const [isReduced, setIsReduced] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReduced(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setIsReduced(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return (
    <div className="dashboard-content">
          {/* Left Column */}
          <div className="dashboard-left-col">
            {/* Activity Stats Card - Optimized Component */}
            <ActivityChartCard
              title="Time Spent Learning"
              totalValue="56h"
              data={ACTIVITY_DATA}
              dropdownOptions={['Weekly', 'Monthly', 'Yearly']}
              trendPercentage="+18%"
              trendLabel="from last week"
              isReduced={isReduced}
              className="stats-card"
              // Weekly values (default)
              weeklyTotal="56h"
              weeklyTrend="+18%"
              weeklyLabel="from last week"
              // Monthly values
              monthlyTotal="240h"
              monthlyTrend="+12%"
              monthlyLabel="from last month"
              // Yearly values
              yearlyTotal="2,856h"
              yearlyTrend="+24%"
              yearlyLabel="from last year"
            />

            {/* Micro KPIs Row - Learning Metrics */}
            <div className="flex gap-4">
              <div className="glass-card micro-card flex-1 group">
                <CornerPlusIcons />
                <div className="micro-label">Lectures Generated</div>
                <div className="micro-value">48</div>
                <div className="micro-change positive">
                  <span className="change-text">+6 this week</span>
                  <TrendingUpIcon className="change-icon" />
                </div>
              </div>
              <div className="glass-card micro-card flex-1 group">
                <CornerPlusIcons />
                <div className="micro-label">Lectures Completed</div>
                <div className="micro-value">35</div>
                <div className="micro-change positive">
                  <span className="change-text">73% completion</span>
                  <TrendingUpIcon className="change-icon" />
                </div>
              </div>
              <div className="glass-card micro-card flex-1 group">
                <CornerPlusIcons />
                <div className="micro-label">Quizzes Attempted</div>
                <div className="micro-value">28</div>
                <div className="micro-change positive">
                  <span className="change-text">+4 this week</span>
                  <TrendingUpIcon className="change-icon" />
                </div>
              </div>
              <div className="glass-card micro-card flex-1 group">
                <CornerPlusIcons />
                <div className="micro-label">Avg Quiz Score</div>
                <div className="micro-value">87%</div>
                <div className="micro-change positive">
                  <span className="change-text">+5% improved</span>
                  <TrendingUpIcon className="change-icon" />
                </div>
              </div>
            </div>

            {/* Bottom Row Cards - Learning Progress */}
            <div className="bottom-row">
              {/* Recent Lectures Progress */}
              <div className="glass-card group flex-1">
                <CornerPlusIcons />
                <h3 className="card-title mb-4">Recent Lectures Progress</h3>
                <div className="space-y-4">
                  <div className="lecture-progress-item">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium text-gray-200">English Grammar Basics</span>
                      </div>
                      <span className="text-xs text-orange-400 font-semibold">85%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 1, delay: 0.1 }}
                      />
                    </div>
                  </div>
                  <div className="lecture-progress-item">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium text-gray-200">Vocabulary Building</span>
                      </div>
                      <span className="text-xs text-orange-400 font-semibold">92%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                        initial={{ width: 0 }}
                        animate={{ width: "92%" }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                  <div className="lecture-progress-item">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium text-gray-200">Pronunciation Practice</span>
                      </div>
                      <span className="text-xs text-orange-400 font-semibold">67%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                        initial={{ width: 0 }}
                        animate={{ width: "67%" }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quizzes Solved */}
              <div className="glass-card group flex-1">
                <CornerPlusIcons />
                <h3 className="card-title mb-4">Quizzes Solved</h3>
                <div className="space-y-4">
                  <div className="insight-item">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--dashboard-success)]/20 flex items-center justify-center flex-shrink-0">
                        <CheckSquareIcon className="w-5 h-5 text-[var(--dashboard-success)]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[var(--dashboard-text-primary)] mb-1">Grammar Quiz</div>
                        <div className="text-xs text-[var(--dashboard-text-secondary)]">5 quizzes completed • 95% average score</div>
                      </div>
                    </div>
                  </div>
                  <div className="insight-item">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--dashboard-accent-1)]/20 flex items-center justify-center flex-shrink-0">
                        <CheckSquareIcon className="w-5 h-5 text-[var(--dashboard-accent-1)]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[var(--dashboard-text-primary)] mb-1">Vocabulary Quiz</div>
                        <div className="text-xs text-[var(--dashboard-text-secondary)]">8 quizzes completed • 87% average score</div>
                      </div>
                    </div>
                  </div>
                  <div className="insight-item">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--dashboard-accent-2)]/20 flex items-center justify-center flex-shrink-0">
                        <CheckSquareIcon className="w-5 h-5 text-[var(--dashboard-accent-2)]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[var(--dashboard-text-primary)] mb-1">Pronunciation Quiz</div>
                        <div className="text-xs text-[var(--dashboard-text-secondary)]">3 quizzes completed • 78% average score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="dashboard-right-col">
            {/* Streak Card */}
            <div className="glass-card group">
              <CornerPlusIcons />
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title">Current Streak</h3>
                <ZapIcon className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-center">
                <motion.div 
                  className="text-6xl font-bold text-orange-400 mb-2"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  12
                </motion.div>
                <div className="text-sm text-gray-400">Days in a row</div>
                <div className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="text-xs text-orange-400 font-semibold mb-1">Keep it up! 🔥</div>
                  <div className="text-xs text-gray-500">Your longest streak: 18 days</div>
                </div>
              </div>
            </div>

            {/* User Rank Card */}
            <div className="glass-card group">
              <CornerPlusIcons />
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title">Your Rank</h3>
                <AwardIcon className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-center">
                <motion.div 
                  className="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  #24
                </motion.div>
                <div className="text-sm text-gray-400 mb-4">Out of 1,247 learners</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Top 2%</span>
                    <span className="text-orange-400 font-semibold">Elite Learner 🏆</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-orange-500 to-yellow-400"
                      initial={{ width: 0 }}
                      animate={{ width: "98%" }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="glass-card group">
              <CornerPlusIcons />
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title">Notes</h3>
                <BookOpenIcon className="w-5 h-5 text-orange-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Notes</span>
                  <span className="text-lg font-bold text-orange-400">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">This Week</span>
                  <span className="text-lg font-bold text-gray-200">23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Avg per Lecture</span>
                  <span className="text-lg font-bold text-gray-200">4.5</span>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-800">
                  <div className="text-xs text-gray-500 mb-2">Recent Topics</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-400">Grammar</span>
                    <span className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-400">Vocabulary</span>
                    <span className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-400">Pronunciation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* <PlatformsCard data={PLATFORMS} /> */}
            {/* <SentimentsCard data={SENTIMENTS} isReduced={isReduced} /> */}
          </div>
        </div>
  )
}

// ========== Components ==========

function PlatformsCard({ data }: { data: typeof PLATFORMS }) {
  return (
    <div className="glass-card platforms-card group">
      <CornerPlusIcons />
      <h3 className="card-title">Platforms</h3>
      <div className="platforms-list">
        {data.map((platform) => (
          <div key={platform.name} className="platform-row">
            <div className="platform-info">
              <span className="platform-icon">{platform.icon}</span>
              <span className="platform-name">{platform.name}</span>
            </div>
            <div className="platform-progress">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'progress-dot',
                    i < Math.floor(platform.progress * 10) && 'filled'
                  )}
                />
              ))}
            </div>
            <div className="platform-value">{platform.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SentimentsCard({ data, isReduced }: { data: typeof SENTIMENTS; isReduced: boolean }) {
  const [animated, setAnimated] = useState(false)
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200)
    return () => clearTimeout(timer)
  }, [])

  let cumulativePercent = 0

  return (
    <div className="glass-card sentiments-card group">
      <CornerPlusIcons />
      <h3 className="card-title">Sentiments</h3>
      <div className="sentiments-content">
        <div className="sentiments-legend">
          {data.map((item) => (
            <div key={item.label} className="sentiment-item">
              <div className="sentiment-color" style={{ background: item.color }} />
              <div className="sentiment-info">
                <span className="sentiment-label">{item.label}</span>
                <span className="sentiment-percent">{item.value}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="donut-container">
          <svg viewBox="0 0 120 120" className="donut-chart">
            <defs>
              {data.map((item, i) => (
                <linearGradient key={i} id={`sentiment-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={item.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={item.color} stopOpacity="0.7" />
                </linearGradient>
              ))}
            </defs>

            {data.map((item, index) => {
              const percent = item.value / 100
              const radius = 50
              const circumference = 2 * Math.PI * radius
              const offset = circumference * (1 - percent)
              const rotation = (cumulativePercent * 360) - 90
              
              const segment = (
                <circle
                  key={item.label}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={`url(#sentiment-${index})`}
                  strokeWidth="16"
                  strokeDasharray={circumference}
                  strokeDashoffset={animated ? offset : circumference}
                  transform={`rotate(${rotation} 60 60)`}
                  className="donut-segment"
                  style={{
                    transition: isReduced ? 'none' : 'stroke-dashoffset 600ms ease-out',
                  }}
                />
              )
              
              cumulativePercent += percent
              return segment
            })}

            <text
              x="60"
              y="55"
              textAnchor="middle"
              fill="#B9B6BE"
              fontSize="10"
              fontWeight="500"
            >
              Total
            </text>
            <text
              x="60"
              y="68"
              textAnchor="middle"
              fill="#E9E7EA"
              fontSize="16"
              fontWeight="700"
            >
              100%
            </text>
          </svg>
        </div>
      </div>
    </div>
  )
}

function TimeSpentCard({ data }: { data: typeof TIME_SPENT_DATA }) {
  const maxHours = Math.max(...data.map((d) => d.hours))

  return (
    <div className="glass-card time-card group">
      <CornerPlusIcons />
      <h3 className="card-title">Time Spent In Meetings</h3>
      <div className="person-list">
        {data.map((person, index) => (
          <div key={index} className="person-row">
            <div className="person-avatar">{person.avatar}</div>
            <div className="person-info">
              <div className="person-name">{person.name}</div>
              <div className="person-role">{person.role}</div>
            </div>
            <div className="person-progress">
              <div
                className="progress-fill"
                style={{ width: `${(person.hours / maxHours) * 100}%` }}
              />
            </div>
            <div className="person-time">{person.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TalkListenCard({ data }: { data: typeof TALK_LISTEN_DATA }) {
  return (
    <div className="glass-card talk-listen-card group">
      <CornerPlusIcons />
      <h3 className="card-title">Talk To Listen Ratio</h3>
      <div className="person-list">
        {data.map((person, index) => (
          <div key={index} className="person-row">
            <div className="person-avatar">{person.avatar}</div>
            <div className="person-info">
              <div className="person-name">{person.name}</div>
              <div className="person-role">{person.role}</div>
            </div>
            <div className="ratio-bars">
              <div className="ratio-bar talk" style={{ width: `${person.talk}%` }}>
                <span className="ratio-label">{person.talk}%</span>
              </div>
              <div className="ratio-bar listen" style={{ width: `${person.listen}%` }}>
                <span className="ratio-label">{person.listen}%</span>
              </div>
            </div>
            <div className="person-time">{person.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
