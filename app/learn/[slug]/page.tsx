'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Course, Lesson, LessonProgress } from '@/lib/types'

// ─── Bunny CDN URL helper ─────────────────────────────────────────────────────
const BUNNY_URL = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net'

const getFullUrl = (path: string | null) => {
  if (!path) return ''
  if (path.includes('sg.storage.bunnycdn.com')) {
    return path.replace('https://sg.storage.bunnycdn.com/smartlearn', BUNNY_URL)
  }
  if (!path.startsWith('http')) {
    return `${BUNNY_URL}/${path}`
  }
  return path
}

// ─── Bunny Player ─────────────────────────────────────────────────────────────
function BunnyPlayer({ lesson, onProgress, onComplete }: {
  lesson: Lesson
  onProgress: (pct: number) => void
  onComplete: () => void
}) {
  const completedRef = useRef(false)
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID
  const embedUrl = lesson.bunny_video_id && libraryId
    ? `https://iframe.mediadelivery.net/embed/${libraryId}/${lesson.bunny_video_id}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`
    : getFullUrl(lesson.video_url)

  useEffect(() => {
    completedRef.current = false
    function handleMessage(e: MessageEvent) {
      try {
        const raw = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (!raw) return
        const event = raw.event || raw.type
        const currentTime = raw.currentTime ?? raw.data?.currentTime ?? 0
        const duration = raw.duration ?? raw.data?.duration ?? 0
        if ((event === 'timeupdate' || event === 'onTimeUpdate') && duration > 0) {
          const pct = Math.round((currentTime / duration) * 100)
          onProgress(pct)
          if (pct >= 90 && !completedRef.current) { completedRef.current = true; onComplete() }
        }
        if (event === 'ended' || event === 'onEnded') {
          onProgress(100)
          if (!completedRef.current) { completedRef.current = true; onComplete() }
        }
      } catch {}
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [lesson.id, onProgress, onComplete])

  if (!embedUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#060D1F]">
        <div className="text-5xl mb-3 opacity-20">▶</div>
        <p className="text-white/20 text-sm">Video coming soon</p>
      </div>
    )
  }
  return (
    <iframe src={embedUrl} className="w-full h-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen />
  )
}

// ─── File Viewer ──────────────────────────────────────────────────────────────
function FileViewer({ lesson, onComplete }: { lesson: Lesson; onComplete: () => void }) {
  const fileUrl = getFullUrl(lesson.file_url || lesson.video_url || '')
  const isPDF = lesson.content_type === 'pdf' || fileUrl.toLowerCase().endsWith('.pdf')

  if (!fileUrl) return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-white/20 text-sm">File not available</p>
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col bg-[#060D1F]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] flex-shrink-0">
        <span className="text-xs text-white/30 uppercase tracking-wider">{isPDF ? 'PDF Document' : 'File'}</span>
        <div className="flex items-center gap-2">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-white/30 hover:text-white/70 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">Open ↗</a>
          <a href={fileUrl} download
            className="text-xs text-white/30 hover:text-white/70 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">↓ Download</a>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {isPDF
          ? <iframe src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`} className="w-full h-full border-0" />
          : <div className="flex flex-col items-center justify-center h-full gap-5">
              <div className="text-6xl">📎</div>
              <p className="text-white/50 text-sm font-medium">{lesson.title}</p>
              <a href={fileUrl} download target="_blank" rel="noopener noreferrer"
                className="bg-[#2563EB] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-500 transition-colors">↓ Download File</a>
            </div>}
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] flex-shrink-0 bg-[#0A1628]">
        <span className="text-xs text-white/20">Read the document above, then mark complete</span>
        <button onClick={onComplete}
          className="flex items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-emerald-500/20">
          ✓ Mark as Read
        </button>
      </div>
    </div>
  )
}

// ─── Main Learn Page ──────────────────────────────────────────────────────────
export default function LearnPage() {
  const { slug } = useParams()
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLessonId = searchParams.get('lesson')

  const [course, setCourse] = useState<Course | null>(null)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({})
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [livePercent, setLivePercent] = useState(0)
  const savingRef = useRef(false)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { if (slug) fetchCourse() }, [slug])
  useEffect(() => { if (user && course) checkEnrollment() }, [user, course])
  useEffect(() => { if (user && course?.lessons?.length) loadProgress() }, [user, course])
  useEffect(() => {
    setLivePercent(activeLesson ? (progressMap[activeLesson.id]?.watch_percent ?? 0) : 0)
  }, [activeLesson?.id])

  // Open sidebar by default on desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setSidebarOpen(mq.matches)
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  async function fetchCourse() {
    try {
      const res = await fetch(`/api/courses/${slug}`)
      const data = await res.json()
      if (data.course) {
        setCourse(data.course)
        const lessons = data.course.lessons || []
        if (lessons.length > 0) {
          const target = initialLessonId ? lessons.find((l: Lesson) => l.id === initialLessonId) : null
          setActiveLesson(target || lessons[0])
        }
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function checkEnrollment() {
    try {
      const res = await fetch(`/api/courses/${slug}/enrollment`)
      const data = await res.json()
      if (!data.enrolled) router.push(`/courses/${slug}`)
    } catch { router.push(`/courses/${slug}`) }
  }

  async function loadProgress() {
    if (!course?.lessons) return
    const results = await Promise.allSettled(
      course.lessons.map(l => fetch(`/api/lessons/${l.id}/progress`).then(r => r.json()))
    )
    const map: Record<string, LessonProgress> = {}
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value.progress) map[course.lessons![i].id] = r.value.progress
    })
    setProgressMap(map)
  }

  const saveProgress = useCallback(async (lesson: Lesson, watchPercent: number, isCompleted: boolean) => {
    if (!course) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      if (savingRef.current) return
      savingRef.current = true
      try {
        const res = await fetch(`/api/lessons/${lesson.id}/progress`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: course.id, watch_percent: watchPercent, is_completed: isCompleted }),
        })
        const data = await res.json()
        if (data.progress) setProgressMap(prev => ({ ...prev, [lesson.id]: data.progress }))
      } catch (e) { console.error(e) }
      finally { savingRef.current = false }
    }, 2000)
  }, [course])

  const handleVideoProgress = useCallback((pct: number) => {
    setLivePercent(pct)
    if (activeLesson) {
      const current = progressMap[activeLesson.id]
      if (pct > (current?.watch_percent ?? 0)) saveProgress(activeLesson, pct, current?.is_completed ?? false)
    }
  }, [activeLesson, progressMap, saveProgress])

  const handleComplete = useCallback(async () => {
    if (!activeLesson || !course) return
    if (progressMap[activeLesson.id]?.is_completed) return
    if (savingRef.current) return
    savingRef.current = true
    try {
      const res = await fetch(`/api/lessons/${activeLesson.id}/progress`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id, watch_percent: 100, is_completed: true }),
      })
      const data = await res.json()
      if (data.progress) setProgressMap(prev => ({ ...prev, [activeLesson.id]: data.progress }))
    } catch (e) { console.error(e) }
    finally { savingRef.current = false }
  }, [activeLesson, course, progressMap])

  function selectLesson(lesson: Lesson) {
    setActiveLesson(lesson)
    setLivePercent(progressMap[lesson.id]?.watch_percent ?? 0)
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  const totalLessons = course?.lessons?.length || 0
  const completedCount = Object.values(progressMap).filter(p => p.is_completed).length
  const overallPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const nextLesson = (() => {
    if (!course?.lessons || !activeLesson) return null
    const idx = course.lessons.findIndex(l => l.id === activeLesson.id)
    return course.lessons[idx + 1] ?? null
  })()
  const isVideo = !activeLesson?.content_type || activeLesson.content_type === 'video'
  const activeLessonProgress = activeLesson ? progressMap[activeLesson.id] : null

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#060D1F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
          <p className="text-white/20 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#060D1F] flex items-center justify-center text-center">
        <div>
          <p className="text-4xl mb-4">😕</p>
          <p className="text-white/40 mb-4">Course not found</p>
          <a href="/dashboard" className="text-[#2563EB] text-sm hover:underline">← Dashboard</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060D1F] flex flex-col">

      {/* ── Top Bar ── */}
      <header className="h-14 bg-[#0A1628] border-b border-white/[0.06] flex items-center justify-between px-4 flex-shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/dashboard" className="flex items-center gap-1.5 text-white/30 hover:text-white/70 transition-colors text-sm flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            <span className="hidden sm:inline">Dashboard</span>
          </a>
          <div className="w-px h-4 bg-white/10 flex-shrink-0" />
          <span className="text-white/60 text-sm font-medium truncate">{course.title}</span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {totalLessons > 0 && (
            <div className="hidden md:flex items-center gap-2.5">
              <div className="w-24 h-1 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-[#2563EB] rounded-full transition-all duration-700" style={{ width: `${overallPercent}%` }} />
              </div>
              <span className="text-white/25 text-xs tabular-nums">{overallPercent}%</span>
            </div>
          )}
          {overallPercent === 100 && (
            <a href={`/certificate/${slug}`}
              className="hidden sm:flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors bg-amber-400/10 px-3 py-1.5 rounded-lg">
              🎓 Certificate
            </a>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/30 hover:text-white/70 transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg"
            title={sidebarOpen ? 'Hide contents' : 'Show contents'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Content Area ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Player */}
          <div className="bg-black flex-shrink-0 relative" style={{ aspectRatio: '16/9', maxHeight: '68vh' }}>
            {activeLesson ? (
              isVideo
                ? <BunnyPlayer key={activeLesson.id} lesson={activeLesson} onProgress={handleVideoProgress} onComplete={handleComplete} />
                : <FileViewer key={activeLesson.id} lesson={activeLesson} onComplete={handleComplete} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/10">
                <p className="text-sm">Select a lesson to begin</p>
              </div>
            )}
            {isVideo && livePercent > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20 pointer-events-none">
                <div className="h-full bg-[#2563EB] transition-all duration-1000" style={{ width: `${livePercent}%` }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 overflow-y-auto bg-[#0A1628]/50 px-4 sm:px-6 py-5">
            {activeLesson ? (
              <div className="max-w-2xl">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20">
                        {isVideo ? 'Video lesson' : activeLesson.content_type === 'pdf' ? 'PDF document' : 'File'}
                      </span>
                      {activeLessonProgress?.is_completed && (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400">· Completed ✓</span>
                      )}
                    </div>
                    <h2 className="text-white text-lg font-semibold leading-snug">{activeLesson.title}</h2>
                  </div>
                  {isVideo && !activeLessonProgress?.is_completed && (
                    <button onClick={handleComplete}
                      className="flex-shrink-0 text-xs text-white/25 hover:text-emerald-400 transition-colors border border-white/8 hover:border-emerald-500/30 px-3 py-1.5 rounded-lg">
                      Mark complete
                    </button>
                  )}
                </div>

                {isVideo && livePercent > 0 && !activeLessonProgress?.is_completed && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-0.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2563EB]/50 rounded-full transition-all" style={{ width: `${livePercent}%` }} />
                    </div>
                    <span className="text-[11px] text-white/20 tabular-nums">{livePercent}% watched</span>
                  </div>
                )}

                {activeLesson.description && (
                  <p className="text-white/35 text-sm leading-relaxed mb-5">{activeLesson.description}</p>
                )}

                {activeLesson.file_url && isVideo && (
                  <div className="mb-5 p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Resources</p>
                    <a href={getFullUrl(activeLesson.file_url)} download target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#2563EB] hover:text-blue-400 transition-colors">
                      <span>📎</span><span>Download lesson file</span>
                    </a>
                  </div>
                )}

                {nextLesson && (
                  <button onClick={() => selectLesson(nextLesson)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[#2563EB]/20 transition-all group text-left">
                    <div className="w-9 h-9 rounded-full bg-[#2563EB]/10 group-hover:bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0 transition-all">
                      <svg className="text-[#2563EB]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mb-0.5">Up next</p>
                      <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors truncate">{nextLesson.title}</p>
                    </div>
                  </button>
                )}

                {overallPercent === 100 && !nextLesson && (
                  <div className="mt-5 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 text-center">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="text-emerald-300 font-semibold text-lg mb-1">Course Complete!</p>
                    <p className="text-white/30 text-sm mb-4">You've finished every lesson.</p>
                    <a href={`/certificate/${slug}`}
                      className="inline-flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-5 py-2.5 rounded-xl text-sm font-medium transition-all">
                      🎓 Get Your Certificate →
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/15 text-sm">Select a lesson from the sidebar to begin.</p>
            )}
          </div>
        </div>

        {/* ── Mobile overlay backdrop ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`
          fixed md:relative right-0 top-0 bottom-0 md:top-auto md:bottom-auto
          w-80 bg-[#0A1628] border-l border-white/[0.06] flex flex-col
          transition-transform duration-300 z-20
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:hidden'}
          md:flex-shrink-0
        `} style={{ marginTop: sidebarOpen ? '56px' : '0' }}>

          <div className="px-4 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white/70 text-sm font-semibold">Course Content</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/25 tabular-nums">{completedCount}/{totalLessons}</span>
                <button onClick={() => setSidebarOpen(false)}
                  className="md:hidden text-white/30 hover:text-white/70 w-6 h-6 flex items-center justify-center">✕</button>
              </div>
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-[#2563EB] rounded-full transition-all duration-700" style={{ width: `${overallPercent}%` }} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {course.lessons?.map((lesson, index) => {
              const progress = progressMap[lesson.id]
              const isCompleted = progress?.is_completed ?? false
              const watchPct = progress?.watch_percent ?? 0
              const isActive = activeLesson?.id === lesson.id
              const type = lesson.content_type || 'video'

              return (
                <button key={lesson.id} onClick={() => selectLesson(lesson)}
                  className={`w-full text-left px-4 py-3.5 border-b border-white/[0.03] transition-all relative group ${isActive ? 'bg-[#2563EB]/8' : 'hover:bg-white/[0.025]'}`}>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#2563EB] rounded-r" />}
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 transition-all ${
                      isCompleted ? 'bg-emerald-500/20 text-emerald-400' : isActive ? 'bg-[#2563EB]/25 text-[#2563EB]' : 'bg-white/5 text-white/20'
                    }`}>
                      {isCompleted ? '✓' : isActive ? '▶' : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium line-clamp-2 leading-snug transition-colors ${
                        isActive ? 'text-white' : isCompleted ? 'text-white/30' : 'text-white/55'
                      }`}>{lesson.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-white/15">{type === 'video' ? '▶' : type === 'pdf' ? '📄' : '📎'}</span>
                        {lesson.duration_seconds > 0 && (
                          <span className="text-[10px] text-white/15 tabular-nums">{Math.floor(lesson.duration_seconds / 60)}m</span>
                        )}
                        {!isCompleted && watchPct > 0 && (
                          <span className="text-[10px] text-[#2563EB]/50 tabular-nums">· {watchPct}%</span>
                        )}
                      </div>
                      {!isCompleted && watchPct > 0 && (
                        <div className="mt-2 h-0.5 bg-white/6 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2563EB]/35 rounded-full" style={{ width: `${watchPct}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}