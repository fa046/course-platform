'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Course } from '@/lib/types'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      fetchEnrolledCourses()
    }
  }, [isLoaded, user])

  async function fetchEnrolledCourses() {
    try {
      const res = await fetch('/api/dashboard/courses')
      const data = await res.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-[#F8F9FF] pt-24">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="h-8 bg-[#0F1F3D]/5 rounded w-48 mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#0F1F3D]/8 overflow-hidden animate-pulse">
                <div className="aspect-video bg-[#0F1F3D]/5" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[#0F1F3D]/5 rounded w-3/4" />
                  <div className="h-3 bg-[#0F1F3D]/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F8F9FF]">

      {/* Header */}
      <div className="bg-[#0F1F3D] pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            {user?.imageUrl && (
              <img src={user.imageUrl} alt={user.fullName || ''} className="w-12 h-12 rounded-full border-2 border-white/20" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {user?.firstName || 'Student'} 👋
              </h1>
              <p className="text-white/50 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Enrolled Courses', value: courses.length },
            { label: 'Completed', value: 0 },
            { label: 'In Progress', value: courses.length },
            { label: 'Certificates', value: 0 },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-[#0F1F3D]/8 rounded-2xl p-5 text-center">
              <div className="text-3xl font-bold text-[#2563EB] mb-1">{stat.value}</div>
              <div className="text-xs text-[#64748B]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* My Courses */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#0F1F3D]">My Courses</h2>
          <Link href="/courses" className="text-sm text-[#2563EB] hover:underline">
            Browse more →
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#0F1F3D]/8">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-[#0F1F3D] mb-2">No courses yet</h3>
            <p className="text-[#64748B] mb-6">Start learning by enrolling in your first course</p>
            <Link href="/courses"
              className="inline-flex items-center gap-2 bg-[#2563EB] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1D4ED8] transition-all">
              Browse Courses →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.id} className="bg-white border border-[#0F1F3D]/8 rounded-2xl overflow-hidden hover:border-[#2563EB]/30 hover:shadow-lg transition-all">
                <div className="aspect-video bg-gradient-to-br from-[#2563EB]/8 to-[#93C5FD]/15 relative flex items-center justify-center overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#2563EB] text-3xl">▶</span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0F1F3D]/10">
                    <div className="h-full bg-[#2563EB] w-0" />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[#0F1F3D] mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-[#64748B] mb-4">
                    {course.lessons?.length || 0} lessons
                  </p>
                  <Link href={`/learn/${course.slug}`}
                    className="w-full flex items-center justify-center gap-2 bg-[#2563EB] text-white font-medium py-2.5 rounded-xl hover:bg-[#1D4ED8] transition-all text-sm">
                    ▶ Continue Learning
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}