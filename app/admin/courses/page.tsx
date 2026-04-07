'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Course } from '@/lib/types'

// Define the Pull Zone URL
const BUNNY_PULL_ZONE = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchCourses = () => {
    fetch('/api/admin/courses')
      .then(r => r.json())
      .then(data => { 
        setCourses(data.courses ?? []); 
        setLoading(false) 
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchCourses() }, [])

  // --- IMAGE URL HELPER ---
  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    
    // 1. Fix old storage URLs on the fly
    if (path.includes('sg.storage.bunnycdn.com')) {
      return path.replace('https://sg.storage.bunnycdn.com/smartlearn', BUNNY_PULL_ZONE);
    }
    
    // 2. If it's a clean relative path, add the CDN domain
    if (!path.startsWith('http')) {
      return `${BUNNY_PULL_ZONE}/${path}`;
    }
    
    return path;
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(slug)
    await fetch(`/api/admin/courses/${slug}`, { method: 'DELETE' })
    fetchCourses()
    setDeleting(null)
  }

  const togglePublish = async (slug: string, current: boolean) => {
    await fetch(`/api/admin/courses/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !current }),
    })
    fetchCourses()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1F3D]">Courses</h1>
          <p className="text-gray-500 mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/admin/courses/new"
          className="bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors">
          + New Course
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {courses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No courses yet.</p>
            <Link href="/admin/courses/new" className="text-[#2563EB] text-sm mt-2 inline-block hover:underline">
              Create your first course →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Course</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                        {course.thumbnail_url ? (
                          <img 
                            src={getImageUrl(course.thumbnail_url) || ''} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">No Image</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#0F1F3D] text-sm truncate">{course.title}</p>
                        <p className="text-xs text-gray-400 truncate font-mono">{course.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {course.is_free ? (
                      <span className="text-green-600 text-sm font-medium">Free</span>
                    ) : (
                      <div>
                        <p className="text-sm text-[#0F1F3D]">₨ {course.price_pkr.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">$ {course.price_usd}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePublish(course.slug, course.is_published)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        course.is_published
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/courses/${course.slug}/lessons`}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors">
                        Lessons
                      </Link>
                      <Link href={`/admin/courses/${course.slug}/edit`}
                        className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(course.slug, course.title)}
                        disabled={deleting === course.slug}
                        className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-40 transition-colors">
                        {deleting === course.slug ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}