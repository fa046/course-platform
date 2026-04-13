'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type EnrolledCourse = {
  id: string
  title: string
  slug: string
  thumbnail_url: string | null
  is_free: boolean
  price_pkr: number
  total_lessons: number
  completed_lessons: number
  percent: number
  is_course_complete: boolean
  enrolled_at: string
}

export default function DashboardPage() {

 const BUNNY_PULL_ZONE = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net'

function getFullImageUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) {
    if (path.includes('.storage.bunnycdn.com')) {
      const match = path.match(/\.storage\.bunnycdn\.com\/[^/]+\/(.+)/)
      return match ? `${BUNNY_PULL_ZONE}/${match[1]}` : path
    }
    return path
  }
  return `${BUNNY_PULL_ZONE}/${path.replace(/^\//, '')}`
}
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && !user) { router.push('/sign-in'); return }
    if (user) fetchDashboard()
  }, [user, isLoaded])

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/dashboard/courses')
      const data = await res.json()
      const enrolled: EnrolledCourse[] = data.courses || []

      // Fetch progress for each course in parallel
      const withProgress = await Promise.all(
        enrolled.map(async (course) => {
          try {
            const res = await fetch(`/api/courses/${course.slug}/progress`)
            const p = await res.json()
            return {
              ...course,
              total_lessons: p.total_lessons ?? 0,
              completed_lessons: p.completed_lessons ?? 0,
              percent: p.percent ?? 0,
              is_course_complete: p.is_course_complete ?? false,
            }
          } catch {
            return { ...course, total_lessons: 0, completed_lessons: 0, percent: 0, is_course_complete: false }
          }
        })
      )
      setCourses(withProgress)
    } catch (e) {
      console.error('Dashboard error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-[#F8F9FF] pt-24">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="h-8 bg-[#0F1F3D]/5 rounded w-48 mb-8 animate-pulse" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-[#0F1F3D]/5" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  const completedCourses = courses.filter(c => c.is_course_complete).length
  const inProgressCourses = courses.filter(c => !c.is_course_complete && c.percent > 0).length

  return (
    <main className="min-h-screen bg-[#F8F9FF] pt-24">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F1F3D] mb-1">
            My Learning
          </h1>
          <p className="text-[#64748B] text-sm">
            Welcome back, {user?.firstName || 'there'} 👋
          </p>
        </div>

        {/* Stats row */}
        {courses.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Enrolled', value: courses.length, color: 'text-[#2563EB]' },
              { label: 'In Progress', value: inProgressCourses, color: 'text-amber-600' },
              { label: 'Completed', value: completedCourses, color: 'text-emerald-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[#0F1F3D]/6 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-[#64748B] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Course cards */}
        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#0F1F3D]/6">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-[#0F1F3D] mb-2">No courses yet</h2>
            <p className="text-[#64748B] mb-6">Browse our courses and start learning today.</p>
            <a href="/courses"
              className="inline-block bg-[#2563EB] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1D4ED8] transition-colors">
              Browse Courses →
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.id}
                className="bg-white rounded-2xl border border-[#0F1F3D]/6 overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all group">

                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-[#2563EB]/10 to-[#93C5FD]/20 relative overflow-hidden">
                  {getFullImageUrl(course.thumbnail_url)
                    ? <img src={getFullImageUrl(course.thumbnail_url)!} alt={course.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-[#2563EB] text-3xl">▶</div>}

                  {/* Completion badge */}
                  {course.is_course_complete && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      🎓 Complete
                    </div>
                  )}
                  {!course.is_course_complete && course.percent > 0 && (
                    <div className="absolute top-3 right-3 bg-white/90 text-[#0F1F3D] text-xs font-bold px-2.5 py-1 rounded-full">
                      {course.percent}%
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-[#0F1F3D] text-sm leading-snug mb-3 line-clamp-2 group-hover:text-[#2563EB] transition-colors">
                    {course.title}
                  </h3>

                  {/* Progress bar */}
                  {course.total_lessons > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-[#64748B] mb-1.5">
                        <span>{course.completed_lessons}/{course.total_lessons} lessons</span>
                        <span className={course.is_course_complete ? 'text-emerald-600 font-medium' : ''}>
                          {course.percent}% complete
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#0F1F3D]/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${course.is_course_complete ? 'bg-emerald-500' : 'bg-[#2563EB]'}`}
                          style={{ width: `${course.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => router.push(`/learn/${course.slug}`)}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      course.is_course_complete
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : course.percent > 0
                        ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                        : 'bg-[#0F1F3D]/5 text-[#0F1F3D] hover:bg-[#0F1F3D]/10'
                    }`}
                  >
                    {course.is_course_complete
                      ? '🎓 Review Course'
                      : course.percent > 0
                      ? '▶ Continue Learning'
                      : '▶ Start Learning'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
