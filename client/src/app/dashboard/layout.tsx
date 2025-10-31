'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import './dashboard.css'
import {
  BarChart3Icon,
  NotebookIcon,
  FileTextIcon,
  GraduationCapIcon,
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-root">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Top Bar */}
        <TopBar />

        {/* Content */}
        {children}
      </div>
    </div>
  )
}

function Sidebar() {
  const pathname = usePathname()
  
  const menuItems = [
    { icon: BarChart3Icon, label: 'Analytics', href: '/dashboard' },
    { icon: FileTextIcon, label: 'Notes', href: '/dashboard/notes' },
    { icon: NotebookIcon, label: 'Quizzes', href: '/dashboard/quizzes' },
    { icon: GraduationCapIcon, label: 'Lessons', href: '/dashboard/lessons' },
  ]

  return (
    <aside className="sidebar">
      <a href="/" className="sidebar-brand">
        <span className="brand-text">Mindly</span>
      </a>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={cn('sidebar-item', pathname === item.href && 'active')}
          >
            <item.icon className="sidebar-icon" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}

function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-right">
        <div className="profile-avatar">
          <span>👤</span>
        </div>
      </div>
    </header>
  )
}
