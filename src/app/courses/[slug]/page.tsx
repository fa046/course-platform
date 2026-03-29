'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Course } from '@/lib/types'
import EnrollmentModal from '@/components/EnrollmentModal'

export default function CoursePage() {
  const { slug } = useParams()
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchCourse()
    }
  }, [slug])

  useEffect(() => {
    if (user && course) {
      checkEnrollment()
    }
  }, [user, course])

  async function fetchCourse() {
    try {
      const res = await fetch(`/api/courses/${slug}`)
      const data = await res.json()
      if (data.course) setCourse(data.course)
    } catch (error) {
      console.error('Failed to fetch course:', error)
    } finally {
      setLoading(false)
    }
  }

  async function checkEnrollment() {
    try {
      const res = await fetch(`/api/courses/${slug}/enrollment`)
      const data = await res.json()
      setEnrolled(data.enrolled)
    } catch (error) {
      console.error('Failed to check enrollment:', error)
    }
  }

  function handleEnrollClick() {
    if (!user) {
      router.push('/sign-in')
      return
    }
    if (enrolled) {
      router.push(`/learn/${slug}`)
      return
    }
    setShowModal(true)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F9FF] pt-24">
        <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
          <div className="h-8 bg-[#0F1F3D]/5 rounded w-1/2 mb-4" />
          <div className="h-4 bg-[#0F1F3D]/5 rounded w-full mb-2" />
          <div className="h-4 bg-[#0F1F3D]/5 rounded w-3/4" />
        </div>
      </main>
    )
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-[#F8F9FF] pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-[#0F1F3D] mb-2">Course not found</h2>
          <p className="text-[#64748B] mb-6">This course may have been removed or is unavailable.</p>
          <a href="/courses" className="text-[#2563EB] hover:underline">Browse all courses →</a>
        </div>
      </main>
    )
  }

  const freeLessons = course.lessons?.filter(l => l.is_free) || []
  const totalLessons = course.lessons?.length || 0
  const totalDuration = course.lessons?.reduce((acc, l) => acc + l.duration_seconds, 0) || 0
  const hours = Math.floor(totalDuration / 3600)
  const minutes = Math.floor((totalDuration % 3600) / 60)

  return (
    <main className="min-h-screen bg-[#F8F9FF]">

      {/* Hero */}
      <div className="bg-[#0F1F3D] pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_380px] gap-12 items-start">
          <div>
            {course.is_free && (
              <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30 mb-4">
                Free Course
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {course.title}
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-6 max-w-2xl">
              {course.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
              <span>📚 {totalLessons} lessons</span>
              {hours > 0 && <span>⏱ {hours}h {minutes}m total</span>}
              <span>♾ Lifetime access</span>
              <span>📜 Certificate included</span>
            </div>
          </div>

          {/* Enrollment Card */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl shadow-black/20 sticky top-24">
            <div className="aspect-video bg-gradient-to-br from-[#2563EB]/10 to-[#93C5FD]/20 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-[#2563EB] text-4xl">▶</span>
              )}
            </div>

            {course.is_free ? (
              <div className="mb-4">
                <span className="text-3xl font-bold text-emerald-600">Free</span>
              </div>
            ) : (
              <div className="mb-4">
                <div className="text-3xl font-bold text-[#0F1F3D]">
                  Rs. {course.price_pkr.toLocaleString()}
                </div>
                <div className="text-sm text-[#64748B] mt-1">${course.price_usd} USD for international students</div>
              </div>
            )}

            <button
              onClick={handleEnrollClick}
              className="w-full py-4 rounded-xl font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg mb-3"
              style={{
                background: enrolled ? '#10B981' : '#2563EB',
                color: 'white',
                boxShadow: enrolled ? '0 8px 25px rgba(16,185,129,0.25)' : '0 8px 25px rgba(37,99,235,0.25)'
              }}>
              {enrolled ? '▶ Continue Learning' : course.is_free ? 'Enroll for Free' : 'Enroll Now'}
            </button>

            {!enrolled && !course.is_free && (
              <p className="text-xs text-[#64748B] text-center">
                30-day money-back guarantee
              </p>
            )}

            <div className="mt-6 pt-6 border-t border-[#0F1F3D]/8 space-y-3">
              {[
                '✓ Lifetime access',
                '✓ Certificate of completion',
                '✓ Urdu & English content',
                `✓ ${totalLessons} video lessons`,
              ].map(item => (
                <div key={item} className="text-sm text-[#64748B]">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-3xl">

          {/* Curriculum */}
          <h2 className="text-2xl font-bold text-[#0F1F3D] mb-6">Course Curriculum</h2>
          <div className="space-y-2 mb-12">
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson, index) => (
                <div key={lesson.id}
                  className="flex items-center justify-between p-4 bg-white border border-[#0F1F3D]/8 rounded-xl hover:border-[#2563EB]/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      lesson.is_free || enrolled
                        ? 'bg-[#2563EB]/10 text-[#2563EB]'
                        : 'bg-[#0F1F3D]/5 text-[#0F1F3D]/30'
                    }`}>
                      {lesson.is_free || enrolled ? '▶' : '🔒'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#0F1F3D]">
                        {index + 1}. {lesson.title}
                      </div>
                      {lesson.is_free && !enrolled && (
                        <span className="text-xs text-emerald-600">Free preview</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-[#64748B] flex-shrink-0">
                    {lesson.duration_seconds > 0
                      ? `${Math.floor(lesson.duration_seconds / 60)}m`
                      : '—'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-[#64748B] bg-white rounded-2xl border border-[#0F1F3D]/8">
                Curriculum coming soon
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Enrollment Modal */}
      {showModal && course && user && (
        <EnrollmentModal
          course={course}
          user={user}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setEnrolled(true)
            setShowModal(false)
            router.push(`/learn/${slug}`)
          }}
        />
      )}

    </main>
  )
}