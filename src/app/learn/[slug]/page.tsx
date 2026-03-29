'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Course, Lesson } from '@/lib/types'

export default function LearnPage() {
  const { slug } = useParams()
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [enrolled, setEnrolled] = useState(false)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (slug) fetchCourse()
  }, [slug])

  useEffect(() => {
    if (user && course) checkEnrollment()
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
      } else {
        setEnrolled(true)
      }
    } catch (error) {
      router.push(`/courses/${slug}`)
    }
  }

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

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col">

      {/* Top Bar */}
      <div className="bg-[#0F1F3D] border-b border-white/10 px-4 h-14 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-1">
            ← Dashboard
          </a>
          <div className="w-px h-4 bg-white/20" />
          <span className="text-white text-sm font-medium line-clamp-1 max-w-xs md:max-w-lg">
            {course.title}
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
          {sidebarOpen ? '← Hide' : '→ Show'} Contents
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video Area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Video Player */}
          <div className="bg-black flex items-center justify-center" style={{ aspectRatio: '16/9', maxHeight: '70vh' }}>
            {activeLesson?.video_url ? (
              <iframe
                src={activeLesson.video_url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center text-white/30">
                <div className="text-6xl mb-4">▶</div>
                <p className="text-sm">Video coming soon</p>
              </div>
            )}
          </div>

          {/* Lesson Info */}
          <div className="flex-1 bg-[#0F1F3D]/50 p-6 overflow-y-auto">
            {activeLesson ? (
              <>
                <h2 className="text-white text-xl font-bold mb-3">{activeLesson.title}</h2>
                {activeLesson.description && (
                  <p className="text-white/60 text-sm leading-relaxed">{activeLesson.description}</p>
                )}
              </>
            ) : (
              <p className="text-white/40 text-sm">Select a lesson to start learning</p>
            )}
          </div>
        </div>

        {/* Sidebar — Curriculum */}
        {sidebarOpen && (
          <div className="w-80 bg-[#0F1F3D] border-l border-white/10 flex flex-col overflow-hidden flex-shrink-0">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm">Course Content</h3>
              <p className="text-white/40 text-xs mt-1">{course.lessons?.length || 0} lessons</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {course.lessons?.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-left p-4 border-b border-white/5 transition-all hover:bg-white/5 ${
                    activeLesson?.id === lesson.id ? 'bg-[#2563EB]/20 border-l-2 border-l-[#2563EB]' : ''
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                      activeLesson?.id === lesson.id
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-white/10 text-white/50'
                    }`}>
                      {activeLesson?.id === lesson.id ? '▶' : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium line-clamp-2 ${
                        activeLesson?.id === lesson.id ? 'text-white' : 'text-white/70'
                      }`}>
                        {lesson.title}
                      </div>
                      {lesson.duration_seconds > 0 && (
                        <div className="text-xs text-white/30 mt-1">
                          {Math.floor(lesson.duration_seconds / 60)}m
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}