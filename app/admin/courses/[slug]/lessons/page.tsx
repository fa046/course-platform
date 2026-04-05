'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Lesson } from '@/lib/types'

type LessonForm = {
  title: string
  bunny_video_id: string
  duration_seconds: number
  is_free: boolean
  description: string
}

const emptyForm: LessonForm = {
  title: '',
  bunny_video_id: '',
  duration_seconds: 0,
  is_free: false,
  description: '',
}

export default function LessonsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [courseTitle, setCourseTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [form, setForm] = useState<LessonForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchLessons = async () => {
    const r = await fetch(`/api/admin/lessons/${slug}`)
    const data = await r.json()
    setLessons(data.lessons ?? [])
    setCourseTitle(data.courseTitle ?? '')
    setLoading(false)
  }

  useEffect(() => { fetchLessons() }, [slug])

  const openNew = () => {
    setEditingLesson(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setForm({
      title: lesson.title,
      bunny_video_id: lesson.bunny_video_id ?? '',
      duration_seconds: lesson.duration_seconds,
      is_free: lesson.is_free,
      description: lesson.description ?? '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Title is required')
    setSaving(true)
    const method = editingLesson ? 'PUT' : 'POST'
    const body = editingLesson
      ? { ...form, id: editingLesson.id }
      : { ...form, position: lessons.length + 1 }

    await fetch(`/api/admin/lessons/${slug}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    await fetchLessons()
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete lesson "${title}"?`)) return
    setDeleting(id)
    await fetch(`/api/admin/lessons/${slug}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await fetchLessons()
    setDeleting(null)
  }

  const moveLesson = async (index: number, direction: 'up' | 'down') => {
    const newLessons = [...lessons]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newLessons.length) return
    ;[newLessons[index], newLessons[swapIndex]] = [newLessons[swapIndex], newLessons[index]]
    const updated = newLessons.map((l, i) => ({ id: l.id, position: i + 1 }))
    setLessons(newLessons)
    await fetch(`/api/admin/lessons/${slug}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessons: updated }),
    })
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
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/admin/courses" className="hover:text-[#2563EB]">Courses</Link>
            <span>/</span>
            <span>{courseTitle}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1F3D]">Lessons</h1>
          <p className="text-gray-500 mt-1">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          className="bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors">
          + Add Lesson
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        {lessons.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No lessons yet.</p>
            <button onClick={openNew} className="text-[#2563EB] text-sm mt-2 hover:underline">
              Add your first lesson →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveLesson(index, 'up')} disabled={index === 0}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▲</button>
                  <button onClick={() => moveLesson(index, 'down')} disabled={index === lessons.length - 1}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▼</button>
                </div>
                <span className="w-6 text-center text-sm text-gray-400 font-mono">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-[#0F1F3D] truncate">{lesson.title}</p>
                    {lesson.is_free && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Free</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {lesson.bunny_video_id && (
                      <p className="text-xs text-gray-400 font-mono truncate">🎬 {lesson.bunny_video_id}</p>
                    )}
                    {lesson.duration_seconds > 0 && (
                      <p className="text-xs text-gray-400">
                        {Math.floor(lesson.duration_seconds / 60)}m {lesson.duration_seconds % 60}s
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => openEdit(lesson)}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium">Edit</button>
                  <button onClick={() => handleDelete(lesson.id, lesson.title)} disabled={deleting === lesson.id}
                    className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-40">
                    {deleting === lesson.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-[#0F1F3D]">
                {editingLesson ? 'Edit Lesson' : 'New Lesson'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Introduction to the course"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bunny.net Video ID</label>
                <input value={form.bunny_video_id}
                  onChange={e => setForm(f => ({ ...f, bunny_video_id: e.target.value }))}
                  placeholder="e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
                <p className="text-xs text-gray-400 mt-1">Find this in Bunny Stream → your video → GUID</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (seconds)</label>
                <input type="number" value={form.duration_seconds}
                  onChange={e => setForm(f => ({ ...f, duration_seconds: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g. 300 for 5 minutes"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Brief description of this lesson"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_free}
                  onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))}
                  className="w-4 h-4 accent-[#2563EB]" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Free preview</span>
                  <p className="text-xs text-gray-400">Non-enrolled users can watch this lesson</p>
                </div>
              </label>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors disabled:opacity-60">
                {saving ? 'Saving...' : editingLesson ? 'Save Changes' : 'Add Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}