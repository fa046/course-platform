'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import CourseForm from '@/components/admin/CourseForm'
import { Course } from '@/lib/types'

export default function EditCoursePage() {
  const { slug } = useParams<{ slug: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/courses/${slug}`)
      .then(r => r.json())
      .then(data => { setCourse(data.course); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!course) return <p className="text-gray-500">Course not found.</p>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F1F3D]">Edit Course</h1>
        <p className="text-gray-500 mt-1">{course.title}</p>
      </div>
      <CourseForm initialData={course} />
    </div>
  )
}