'use client'

import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import './dashboard.css'
import {
  BarChart3Icon,
  NotebookIcon,
  FileTextIcon,
  GraduationCapIcon,
  LogOutIcon,
} from 'lucide-react'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'

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
  const router = useRouter()
  const { logout } = useAuthStore()
  
  const menuItems = [
    { icon: BarChart3Icon, label: 'Analytics', href: '/dashboard' },
    { icon: FileTextIcon, label: 'Your Documents', href: '/dashboard/documents' },
    { icon: NotebookIcon, label: 'Quizzes', href: '/dashboard/quizzes' },
    { icon: GraduationCapIcon, label: 'Lessons', href: '/dashboard/lessons' },
  ]

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully!')
    router.push('/')
  }

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

      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="sidebar-item logout-button"
        >
          <LogOutIcon className="sidebar-icon" />
          <span>Logout</span>
        </button>
      </div>
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
