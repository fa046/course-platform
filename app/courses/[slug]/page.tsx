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
  const [courseComplete, setCourseComplete] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [previewLesson, setPreviewLesson] = useState<string | null>(null)

  useEffect(() => { if (slug) fetchCourse() }, [slug])
  useEffect(() => { if (user && course) checkEnrollment() }, [user, course])
  useEffect(() => { if (enrolled && course) checkCourseProgress() }, [enrolled, course])

  async function fetchCourse() {
    try {
      const res = await fetch(`/api/courses/${slug}`)
      const data = await res.json()
      if (data.course) setCourse(data.course)
    } catch (e) {
      console.error('Failed to fetch course:', e)
    } finally {
      setLoading(false)
    }
  }

  async function checkEnrollment() {
    try {
      const res = await fetch(`/api/courses/${slug}/enrollment`)
      const data = await res.json()
      setEnrolled(data.enrolled)
    } catch (e) {
      console.error('Failed to check enrollment:', e)
    }
  }

  async function checkCourseProgress() {
    try {
      const res = await fetch(`/api/courses/${slug}/progress`)
      const data = await res.json()
      if (data.is_course_complete) setCourseComplete(true)
    } catch (e) {
      console.error('Failed to check progress:', e)
    }
  }

  function handleEnrollClick() {
    if (!user) { router.push('/sign-in'); return }
    if (enrolled) { router.push(`/learn/${slug}`); return }
    setShowModal(true)
  }

  // Clicking a lesson in curriculum
  function handleLessonClick(lessonId: string, isFree: boolean) {
    if (enrolled) {
      // Enrolled → go straight to learn page, open that lesson
      router.push(`/learn/${slug}?lesson=${lessonId}`)
      return
    }
    if (isFree) {
      // Free preview — open in preview modal
      setPreviewLesson(lessonId)
      return
    }
    // Locked — prompt to enroll
    setShowModal(true)
  }

  if (loading || !isLoaded) {
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

  const totalLessons = course.lessons?.length || 0
  const totalDuration = course.lessons?.reduce((acc, l) => acc + (l.duration_seconds || 0), 0) || 0
  const hours = Math.floor(totalDuration / 3600)
  const minutes = Math.floor((totalDuration % 3600) / 60)
  const freeLessonCount = course.lessons?.filter(l => l.is_free).length || 0

  // Button label logic
  const btnLabel = enrolled
    ? courseComplete ? '🎓 Course Completed' : '▶ Continue Learning'
    : course.is_free ? 'Enroll for Free' : 'Enroll Now'

  const btnStyle = enrolled
    ? courseComplete
      ? { background: '#059669', boxShadow: '0 8px 25px rgba(5,150,105,0.25)' }
      : { background: '#10B981', boxShadow: '0 8px 25px rgba(16,185,129,0.25)' }
    : { background: '#2563EB', boxShadow: '0 8px 25px rgba(37,99,235,0.25)' }

  return (
    <main className="min-h-screen bg-[#F8F9FF]">

      {/* ── Hero ── */}
      <div className="bg-[#0F1F3D] pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_380px] gap-12 items-start">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {course.is_free && (
                <span className="inline-flex items-center bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30">
                  Free Course
                </span>
              )}
              {courseComplete && (
                <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-500/30">
                  🎓 Completed
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {course.title}
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-6 max-w-2xl">
              {course.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
              <span>📚 {totalLessons} lessons</span>
              {hours > 0
                ? <span>⏱ {hours}h {minutes}m total</span>
                : minutes > 0
                ? <span>⏱ {minutes}m total</span>
                : null
              }
              <span>♾ Lifetime access</span>
              <span>📜 Certificate included</span>
              {freeLessonCount > 0 && !enrolled && (
                <span className="text-emerald-400">✦ {freeLessonCount} free preview{freeLessonCount > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {/* ── Enrollment Card ── */}
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
                <div className="text-sm text-[#64748B] mt-1">
                  ${course.price_usd} USD for international students
                </div>
              </div>
            )}

            <button
              onClick={handleEnrollClick}
              className="w-full py-4 rounded-xl font-semibold text-base text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-lg mb-3"
              style={btnStyle}
            >
              {btnLabel}
            </button>

            {enrolled && courseComplete && (
              <button
                onClick={() => router.push(`/learn/${slug}`)}
                className="w-full py-3 rounded-xl font-medium text-sm text-[#2563EB] border border-[#2563EB]/20 hover:bg-[#2563EB]/5 transition-all mb-3"
              >
                Review Course →
              </button>
            )}

            {!enrolled && !course.is_free && (
              <p className="text-xs text-[#64748B] text-center mb-4">
                30-day money-back guarantee
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-[#0F1F3D]/8 space-y-2.5">
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

      {/* ── Curriculum ── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0F1F3D]">Course Curriculum</h2>
            {!enrolled && freeLessonCount > 0 && (
              <span className="text-sm text-[#64748B]">
                {freeLessonCount} lesson{freeLessonCount > 1 ? 's' : ''} available for free preview
              </span>
            )}
          </div>

          <div className="space-y-2 mb-12">
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson, index) => {
                const canAccess = enrolled || lesson.is_free
                const contentType = lesson.content_type || 'video'

                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson.id, lesson.is_free)}
                    className={`w-full flex items-center justify-between p-4 bg-white border rounded-xl transition-all text-left group ${
                      canAccess
                        ? 'border-[#0F1F3D]/8 hover:border-[#2563EB]/30 hover:shadow-sm cursor-pointer'
                        : 'border-[#0F1F3D]/8 hover:border-[#0F1F3D]/15 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all ${
                        canAccess
                          ? 'bg-[#2563EB]/10 text-[#2563EB] group-hover:bg-[#2563EB]/20'
                          : 'bg-[#0F1F3D]/5 text-[#0F1F3D]/25'
                      }`}>
                        {!canAccess ? '🔒' : contentType === 'pdf' ? '📄' : contentType === 'file' ? '📎' : '▶'}
                      </div>

                      <div>
                        <div className={`text-sm font-medium transition-colors ${
                          canAccess
                            ? 'text-[#0F1F3D] group-hover:text-[#2563EB]'
                            : 'text-[#0F1F3D]/50'
                        }`}>
                          {index + 1}. {lesson.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {lesson.is_free && !enrolled && (
                            <span className="text-xs text-emerald-600 font-medium">Free preview</span>
                          )}
                          {enrolled && (
                            <span className="text-xs text-[#64748B] capitalize">{contentType}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-[#64748B]">
                        {lesson.duration_seconds > 0
                          ? `${Math.floor(lesson.duration_seconds / 60)}m`
                          : '—'}
                      </span>
                      {canAccess && (
                        <svg className="text-[#2563EB]/40 group-hover:text-[#2563EB] transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="text-center py-10 text-[#64748B] bg-white rounded-2xl border border-[#0F1F3D]/8">
                Curriculum coming soon
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Free Preview Modal ── */}
      {previewLesson && course && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewLesson(null)}
        >
          <div
            className="bg-[#0A1628] rounded-2xl overflow-hidden w-full max-w-3xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <p className="text-white font-semibold text-sm">Free Preview</p>
                <p className="text-white/40 text-xs mt-0.5">{course.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setPreviewLesson(null); setShowModal(true) }}
                  className="text-xs bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors font-medium"
                >
                  Enroll for Full Access
                </button>
                <button
                  onClick={() => setPreviewLesson(null)}
                  className="text-white/40 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Video */}
            <div className="aspect-video bg-black">
              {(() => {
                const lesson = course.lessons?.find(l => l.id === previewLesson)
                const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID
                if (!lesson) return null
                const embedUrl = lesson.bunny_video_id && libraryId
                  ? `https://iframe.mediadelivery.net/embed/${libraryId}/${lesson.bunny_video_id}?autoplay=true&responsive=true`
                  : lesson.video_url || null

                if (!embedUrl) return (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <p className="text-sm">Video coming soon</p>
                  </div>
                )
                return (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                )
              })()}
            </div>

            {/* Lesson title */}
            <div className="px-5 py-4">
              <p className="text-white/70 text-sm">
                {course.lessons?.find(l => l.id === previewLesson)?.title}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Enrollment Modal ── */}
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