'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import EnrollmentModal from '@/components/EnrollmentModal'
import { Course, Lesson } from '@/lib/types'

export default function CourseDetailPage() {
  const { slug } = useParams()
  const { user } = useUser()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  
  // NEW: State to track which lesson the user wants to preview
  const [selectedPreviewLesson, setSelectedPreviewLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    if (slug) {
      fetch(`/api/courses/${slug}`)
        .then(r => r.json())
        .then(data => {
          setCourse(data.course)
          setLoading(false)
        })
    }
  }, [slug])

  if (loading) return <div className="p-20 text-center">Loading Course...</div>
  if (!course) return <div className="p-20 text-center">Course not found.</div>

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left: Content */}
        <div className="lg:col-span-2 space-y-8">
          <h1 className="text-4xl font-bold text-[#0F1F3D]">{course.title}</h1>
          <p className="text-gray-600 leading-relaxed">{course.description}</p>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#0F1F3D]">Curriculum</h2>
            <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {course.lessons?.map((lesson, idx) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-300 font-mono text-sm">{idx + 1}</span>
                    <span className="text-gray-700 font-medium">{lesson.title}</span>
                  </div>
                  
                  {/* FREE PREVIEW BUTTON */}
                  {lesson.is_free && (
                    <button
                      onClick={() => {
                        setSelectedPreviewLesson(lesson); // 1. Set the lesson data
                        setShowEnrollModal(true);        // 2. Open the modal
                      }}
                      className="text-[#2563EB] text-sm font-semibold hover:underline"
                    >
                      Free Preview
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="text-3xl font-bold text-[#0F1F3D] mb-6">
              {course.is_free ? 'Free' : `Rs. ${course.price_pkr.toLocaleString()}`}
            </div>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="w-full py-4 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              Enroll Now
            </button>
          </div>
        </div>
      </div>

      {/* ENROLLMENT MODAL */}
      {showEnrollModal && (
        <EnrollmentModal
          course={course}
          user={user}
          onClose={() => {
            setShowEnrollModal(false);
            setSelectedPreviewLesson(null); // Clear the lesson when modal closes
          }}
          onSuccess={() => router.push(`/learn/${course.slug}`)}
          // PASS THE LESSON DATA HERE
          initialPreviewLesson={selectedPreviewLesson}
        />
      )}
    </div>
  )
}