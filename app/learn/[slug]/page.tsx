'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Course, Lesson, LessonProgress } from '@/lib/types'

export default function LearnPage() {
  const { slug } = useParams()
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({})
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [savingProgress, setSavingProgress] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // ── Fetch course + lessons ──────────────────────────────────────────────────
  useEffect(() => {
    if (slug) fetchCourse()
  }, [slug])

  // ── Check enrollment ────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && course) checkEnrollment()
  }, [user, course])

  // ── Load progress for all lessons when course loads ─────────────────────────
  useEffect(() => {
    if (user && course?.lessons?.length) {
      loadCourseProgress()
    }
  }, [user, course])

  async function fetchCourse() {
    try {
      const res = await fetch(`/api/courses/${slug}`)
      const data = await res.json()
      if (data.course) {
        setCourse(data.course)
        if (data.course.lessons?.length > 0) {
          setActiveLesson(data.course.lessons[0])
        }
      }
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
      if (!data.enrolled) {
        router.push(`/courses/${slug}`)
      }
    } catch {
      router.push(`/courses/${slug}`)
    }
  }

  async function loadCourseProgress() {
    if (!course?.lessons) return
    // Load progress for each lesson in parallel
    const results = await Promise.allSettled(
      course.lessons.map(lesson =>
        fetch(`/api/lessons/${lesson.id}/progress`).then(r => r.json())
      )
    )
    const map: Record<string, LessonProgress> = {}
    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.progress) {
        map[course.lessons![i].id] = result.value.progress
      }
    })
    setProgressMap(map)
  }

  // ── Save progress to backend ────────────────────────────────────────────────
  const saveProgress = useCallback(async (
    lesson: Lesson,
    watchPercent: number,
    isCompleted: boolean
  ) => {
    if (!course || savingProgress) return
    setSavingProgress(true)
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: course.id,
          watch_percent: watchPercent,
          is_completed: isCompleted,
        }),
      })
      const data = await res.json()
      if (data.progress) {
        setProgressMap(prev => ({ ...prev, [lesson.id]: data.progress }))
      }
    } catch (error) {
      console.error('Failed to save progress:', error)
    } finally {
      setSavingProgress(false)
    }
  }, [course, savingProgress])

  // ── Handle lesson switch ────────────────────────────────────────────────────
  function handleLessonSelect(lesson: Lesson) {
    setActiveLesson(lesson)
    // Clear any running progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }
  }

  // ── Mark lesson complete manually ───────────────────────────────────────────
  async function markComplete(lesson: Lesson) {
    await saveProgress(lesson, 100, true)
  }

  // ── Bunny iframe embed URL ──────────────────────────────────────────────────
  function getBunnyEmbedUrl(lesson: Lesson): string | null {
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID
    if (lesson.bunny_video_id && libraryId) {
      return `https://iframe.mediadelivery.net/embed/${libraryId}/${lesson.bunny_video_id}?autoplay=false&loop=false&muted=false&preload=true`
    }
    // Fallback to video_url if set directly
    if (lesson.video_url) return lesson.video_url
    return null
  }

  // ── Compute overall course progress ────────────────────────────────────────
  const totalLessons = course?.lessons?.length || 0
  const completedCount = Object.values(progressMap).filter(p => p.is_completed).length
  const overallPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center">
        <div className="text-white/50 text-sm animate-pulse">Loading your course...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">😕</div>
          <p>Course not found</p>
        </div>
      </div>
    )
  }

  const embedUrl = activeLesson ? getBunnyEmbedUrl(activeLesson) : null
  const activeLessonProgress = activeLesson ? progressMap[activeLesson.id] : null

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col">

      {/* ── Top Bar ── */}
      <div className="bg-[#0F1F3D] border-b border-white/10 px-4 h-14 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <a
            href="/dashboard"
            className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← Dashboard
          </a>
          <div className="w-px h-4 bg-white/20" />
          <span className="text-white text-sm font-medium line-clamp-1 max-w-xs md:max-w-lg">
            {course.title}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Overall progress indicator */}
          {totalLessons > 0 && (
            <div className="hidden md:flex items-center gap-3">
              <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              <span className="text-white/40 text-xs">{overallPercent}% complete</span>
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg"
          >
            {sidebarOpen ? '← Hide' : '→ Show'} Contents
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Video Area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Video Player */}
          <div
            className="bg-black flex items-center justify-center flex-shrink-0"
            style={{ aspectRatio: '16/9', maxHeight: '70vh' }}
          >
            {embedUrl ? (
              <iframe
                ref={iframeRef}
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="text-center text-white/30">
                <div className="text-6xl mb-4">▶</div>
                <p className="text-sm">Video coming soon</p>
              </div>
            )}
          </div>

          {/* ── Lesson Info & Controls ── */}
          <div className="flex-1 bg-[#0F1F3D]/50 p-6 overflow-y-auto">
            {activeLesson ? (
              <div className="max-w-3xl">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="text-white text-xl font-bold">{activeLesson.title}</h2>

                  {/* Mark complete button */}
                  <button
                    onClick={() => markComplete(activeLesson)}
                    disabled={activeLessonProgress?.is_completed}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeLessonProgress?.is_completed
                        ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                        : 'bg-white/10 text-white/70 hover:bg-emerald-500/20 hover:text-emerald-400'
                    }`}
                  >
                    {activeLessonProgress?.is_completed ? '✓ Completed' : 'Mark Complete'}
                  </button>
                </div>

                {/* Watch progress bar */}
                {activeLessonProgress && activeLessonProgress.watch_percent > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-white/30 mb-1">
                      <span>Watch progress</span>
                      <span>{activeLessonProgress.watch_percent}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563EB]/60 rounded-full transition-all"
                        style={{ width: `${activeLessonProgress.watch_percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {activeLesson.description && (
                  <p className="text-white/60 text-sm leading-relaxed">
                    {activeLesson.description}
                  </p>
                )}

                {/* Next lesson button */}
                {course.lessons && activeLesson && (() => {
                  const currentIndex = course.lessons!.findIndex(l => l.id === activeLesson.id)
                  const nextLesson = course.lessons![currentIndex + 1]
                  if (!nextLesson) return null
                  return (
                    <button
                      onClick={() => handleLessonSelect(nextLesson)}
                      className="mt-6 flex items-center gap-2 text-sm text-[#2563EB] hover:text-blue-400 transition-colors"
                    >
                      Next: {nextLesson.title} →
                    </button>
                  )
                })()}
              </div>
            ) : (
              <p className="text-white/40 text-sm">Select a lesson to start learning</p>
            )}
          </div>
        </div>

        {/* ── Sidebar — Curriculum ── */}
        {sidebarOpen && (
          <div className="w-80 bg-[#0F1F3D] border-l border-white/10 flex flex-col overflow-hidden flex-shrink-0">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm">Course Content</h3>
              <p className="text-white/40 text-xs mt-1">
                {completedCount}/{totalLessons} lessons completed
              </p>
              {/* Mini overall progress bar */}
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {course.lessons?.map((lesson, index) => {
                const progress = progressMap[lesson.id]
                const isCompleted = progress?.is_completed ?? false
                const watchPercent = progress?.watch_percent ?? 0
                const isActive = activeLesson?.id === lesson.id

                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonSelect(lesson)}
                    className={`w-full text-left p-4 border-b border-white/5 transition-all hover:bg-white/5 ${
                      isActive ? 'bg-[#2563EB]/20 border-l-2 border-l-[#2563EB]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Lesson status icon */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white/10 text-white/50'
                      }`}>
                        {isCompleted ? '✓' : isActive ? '▶' : index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium line-clamp-2 ${
                          isActive ? 'text-white' : isCompleted ? 'text-white/50' : 'text-white/70'
                        }`}>
                          {lesson.title}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          {lesson.duration_seconds > 0 && (
                            <span className="text-xs text-white/30">
                              {Math.floor(lesson.duration_seconds / 60)}m
                            </span>
                          )}
                          {/* Watch progress dot indicator */}
                          {!isCompleted && watchPercent > 0 && (
                            <span className="text-xs text-[#2563EB]/60">
                              {watchPercent}% watched
                            </span>
                          )}
                        </div>

                        {/* Thin progress bar under title */}
                        {!isCompleted && watchPercent > 0 && (
                          <div className="mt-1.5 h-0.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2563EB]/50 rounded-full"
                              style={{ width: `${watchPercent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}