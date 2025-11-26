'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/store/authStore'
import { classroomApi } from '@/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface Course {
  id: string
  name: string
  section?: string
  descriptionHeading?: string
  room?: string
  ownerId: string
  courseState: string
}

export default function GoogleClassroomIntegration() {
  const { googleClassroomConnected, setGoogleClassroomConnected } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [showCourses, setShowCourses] = useState(false)

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const response = await classroomApi.getConnectionStatus()
      if (response.success) {
        setGoogleClassroomConnected(response.data.connected)
      }
    } catch (error) {
      console.error('Error checking connection status:', error)
    }
  }

  const handleConnect = () => {
    try {
      classroomApi.connectGoogleClassroom()
      toast.success('Opening Google authentication...')
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate connection')
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      const response = await classroomApi.disconnectGoogleClassroom()
      if (response.success) {
        setGoogleClassroomConnected(false)
        setCourses([])
        setShowCourses(false)
        toast.success('Google Classroom disconnected')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCourses = async () => {
    setIsLoading(true)
    try {
      const response = await classroomApi.getCourses()
      if (response.success) {
        setCourses(response.data)
        setShowCourses(true)
        toast.success(`Found ${response.data.length} courses`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch courses')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card 
        variant="dots" 
        className="bg-darker border-rust/40 p-6"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Google Classroom Integration
              </h3>
              <p className="text-sm text-white/70 mt-1">
                {googleClassroomConnected
                  ? 'Connected to Google Classroom'
                  : 'Connect your Google Classroom account to import courses and coursework'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  googleClassroomConnected ? 'bg-green-500' : 'bg-gray-500'
                }`}
              />
              <span className="text-sm text-white/70">
                {googleClassroomConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            {!googleClassroomConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="bg-rust hover:bg-rust/90 text-white"
              >
                Connect Google Classroom
              </Button>
            ) : (
              <>
                {/* <Button
                  onClick={fetchCourses}
                  disabled={isLoading}
                  className="bg-rust hover:bg-rust/90 text-white"
                >
                  {isLoading ? 'Loading...' : 'View Courses'}
                </Button> */}
                <Button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  variant="outline"
                  className="border-rust/40 text-white bg-rust/10"
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {showCourses && courses.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Your Courses</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card
                key={course.id}
                variant="dots"
                className="bg-darker border-rust/40 p-4"
              >
                <h5 className="text-white font-semibold mb-2">{course.name}</h5>
                {course.section && (
                  <p className="text-sm text-white/70 mb-1">
                    Section: {course.section}
                  </p>
                )}
                {course.room && (
                  <p className="text-sm text-white/70">Room: {course.room}</p>
                )}
                <div className="mt-3">
                  <span className="text-xs px-2 py-1 bg-rust/20 text-rust rounded">
                    {course.courseState}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showCourses && courses.length === 0 && (
        <Card variant="dots" className="bg-darker border-rust/40 p-6 text-center">
          <p className="text-white/70">No courses found</p>
        </Card>
      )}
    </div>
  )
}
