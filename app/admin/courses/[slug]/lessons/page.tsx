'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Lesson } from '@/lib/types'

const BUNNY_URL = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net'

type Section = { id: string; title: string; position: number }

type LessonForm = {
  title: string
  description: string
  content_type: 'video' | 'pdf' | 'file'
  bunny_video_id: string
  file_url: string
  duration_seconds: number
  is_free: boolean
  section_id: string
}

const emptyForm: LessonForm = {
  title: '', description: '', content_type: 'video',
  bunny_video_id: '', file_url: '', duration_seconds: 0, is_free: false, section_id: '',
}

const getFileUrl = (path: string | null) => {
  if (!path) return ''
  if (path.includes('sg.storage.bunnycdn.com')) return path.replace('https://sg.storage.bunnycdn.com/smartlearn', BUNNY_URL)
  if (!path.startsWith('http')) return `${BUNNY_URL}/${path}`
  return path
}

export default function LessonsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [courseTitle, setCourseTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [form, setForm] = useState<LessonForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')

  // Section management state
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [sectionForm, setSectionForm] = useState({ title: '', description: '' })
  const [savingSection, setSavingSection] = useState(false)

  const videoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = async () => {
    const [lessonsRes, courseRes] = await Promise.all([
      fetch(`/api/admin/lessons/${slug}`),
      fetch(`/api/admin/courses/${slug}`),
    ])
    const lessonsData = await lessonsRes.json()
    const courseData = await courseRes.json()
    setLessons(lessonsData.lessons ?? [])
    setCourseTitle(lessonsData.courseTitle ?? '')
    setSections(courseData.course?.sections ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [slug])

  const openNew = () => { setEditingLesson(null); setForm(emptyForm); setShowForm(true) }

  const openEdit = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setForm({
      title: lesson.title,
      description: lesson.description ?? '',
      content_type: (lesson.content_type as 'video' | 'pdf' | 'file') || 'video',
      bunny_video_id: lesson.bunny_video_id ?? '',
      file_url: lesson.file_url ?? '',
      duration_seconds: lesson.duration_seconds,
      is_free: lesson.is_free,
      section_id: lesson.section_id ?? '',
    })
    setShowForm(true)
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); setUploadProgress(0); setUploadStatus('Creating video on Bunny Stream...')
    try {
      const res = await fetch('/api/lessons/upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title || file.name }),
      })
      const { videoId, uploadUrl, apiKey } = await res.json()
      if (!videoId) throw new Error('Failed to get upload URL')
      setUploadStatus('Uploading video...')
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)) }
        xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error('Upload failed'))
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('AccessKey', apiKey)
        xhr.send(file)
      })
      setUploadStatus('✓ Video uploaded successfully!')
      setForm(f => ({ ...f, bunny_video_id: videoId }))
    } catch (err: any) { setUploadStatus('✗ Upload failed: ' + err.message) }
    finally { setUploading(false) }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); setUploadStatus('Uploading file...')
    try {
      const formData = new FormData()
      formData.append('file', file); formData.append('folder', 'lessons')
      const res = await fetch('/api/admin/upload/file', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setForm(f => ({ ...f, file_url: data.url }))
      setUploadStatus('✓ File uploaded successfully!')
    } catch (err: any) { setUploadStatus('✗ Upload failed: ' + err.message) }
    finally { setUploading(false) }
  }

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Title is required')
    setSaving(true)
    const method = editingLesson ? 'PUT' : 'POST'
    const body = editingLesson
      ? { ...form, id: editingLesson.id, section_id: form.section_id || null }
      : { ...form, position: lessons.length + 1, section_id: form.section_id || null }
    await fetch(`/api/admin/lessons/${slug}`, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    await fetchData(); setShowForm(false); setSaving(false); setUploadStatus('')
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete lesson "${title}"?`)) return
    setDeleting(id)
    await fetch(`/api/admin/lessons/${slug}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    await fetchData(); setDeleting(null)
  }

  const moveLesson = async (index: number, direction: 'up' | 'down') => {
    const newLessons = [...lessons]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newLessons.length) return
    ;[newLessons[index], newLessons[swapIndex]] = [newLessons[swapIndex], newLessons[index]]
    setLessons(newLessons)
    await fetch(`/api/admin/lessons/${slug}/reorder`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessons: newLessons.map((l, i) => ({ id: l.id, position: i + 1 })) }),
    })
  }

  const handleAddSection = async () => {
    if (!sectionForm.title.trim()) return alert('Section title is required')
    setSavingSection(true)
    try {
      const courseRes = await fetch(`/api/admin/courses/${slug}`)
      const courseData = await courseRes.json()
      const courseId = courseData.course?.id
      if (!courseId) throw new Error('Course not found')
      await fetch('/api/admin/sections', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, title: sectionForm.title, description: sectionForm.description, position: sections.length + 1 }),
      })
      setSectionForm({ title: '', description: '' })
      setShowSectionForm(false)
      await fetchData()
    } catch (err: any) { alert('Failed to add section: ' + err.message) }
    finally { setSavingSection(false) }
  }

  const contentIcon = (type: string) => type === 'pdf' ? '📄' : type === 'file' ? '📎' : '🎬'

  // Group lessons by section for display
  const lessonsBySection = sections.map(section => ({
    section,
    lessons: lessons.filter(l => l.section_id === section.id),
  }))
  const unsectionedLessons = lessons.filter(l => !l.section_id)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/admin/courses" className="hover:text-[#2563EB]">Courses</Link>
            <span>/</span><span>{courseTitle}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1F3D]">Curriculum</h1>
          <p className="text-gray-500 mt-1">{sections.length} section{sections.length !== 1 ? 's' : ''} · {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSectionForm(true)}
            className="border border-[#2563EB] text-[#2563EB] px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#EFF6FF] transition-colors">
            + Add Section
          </button>
          <button onClick={openNew}
            className="bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors">
            + Add Lesson
          </button>
        </div>
      </div>

      {/* Sections with their lessons */}
      {sections.length > 0 ? (
        <div className="space-y-4 mb-6">
          {lessonsBySection.map(({ section, lessons: sectionLessons }) => (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Section header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-xs font-bold text-[#2563EB]">{section.position}</div>
                  <div>
                    <p className="font-semibold text-sm text-[#0F1F3D]">{section.title}</p>
                    <p className="text-xs text-gray-400">{sectionLessons.length} lesson{sectionLessons.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button onClick={() => { setForm(f => ({ ...f, section_id: section.id })); openNew() }}
                  className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium">+ Add lesson here</button>
              </div>
              {/* Lessons in this section */}
              {sectionLessons.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-gray-400">No lessons yet in this section</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {sectionLessons.map((lesson, index) => {
                    const globalIndex = lessons.findIndex(l => l.id === lesson.id)
                    return (
                      <div key={lesson.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveLesson(globalIndex, 'up')} disabled={globalIndex === 0}
                            className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▲</button>
                          <button onClick={() => moveLesson(globalIndex, 'down')} disabled={globalIndex === lessons.length - 1}
                            className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▼</button>
                        </div>
                        <span className="text-lg">{contentIcon(lesson.content_type || 'video')}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-[#0F1F3D] truncate">{lesson.title}</p>
                            {lesson.is_free && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Free</span>}
                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full capitalize">{lesson.content_type}</span>
                          </div>
                          {lesson.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{lesson.description}</p>}
                          <div className="flex items-center gap-3 mt-0.5">
                            {lesson.bunny_video_id && <p className="text-xs text-gray-400 font-mono">🎬 {lesson.bunny_video_id.slice(0, 16)}...</p>}
                            {lesson.file_url && <p className="text-xs text-gray-400">📎 File attached</p>}
                            {lesson.duration_seconds > 0 && <p className="text-xs text-gray-400">{Math.floor(lesson.duration_seconds / 60)}m {lesson.duration_seconds % 60}s</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(lesson)} className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium">Edit</button>
                          <button onClick={() => handleDelete(lesson.id, lesson.title)} disabled={deleting === lesson.id}
                            className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-40">
                            {deleting === lesson.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Unsectioned lessons */}
          {unsectionedLessons.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-sm font-semibold text-amber-700">⚠ Unsectioned Lessons</p>
                <p className="text-xs text-amber-600">These lessons have no section. Edit them to assign a section.</p>
              </div>
              <div className="divide-y divide-gray-50">
                {unsectionedLessons.map((lesson) => {
                  const globalIndex = lessons.findIndex(l => l.id === lesson.id)
                  return (
                    <div key={lesson.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                      <span className="text-lg">{contentIcon(lesson.content_type || 'video')}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-[#0F1F3D] truncate">{lesson.title}</p>
                          {lesson.is_free && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Free</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEdit(lesson)} className="text-xs text-[#2563EB] font-medium">Edit & Assign Section</button>
                        <button onClick={() => handleDelete(lesson.id, lesson.title)} disabled={deleting === lesson.id}
                          className="text-xs text-red-500 font-medium disabled:opacity-40">
                          {deleting === lesson.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No sections — flat list */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
          {lessons.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm mb-1">No lessons yet.</p>
              <p className="text-xs text-gray-300 mb-3">Tip: Add sections first to organise your course into topics.</p>
              <button onClick={openNew} className="text-[#2563EB] text-sm hover:underline">Add your first lesson →</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveLesson(index, 'up')} disabled={index === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs">▲</button>
                    <button onClick={() => moveLesson(index, 'down')} disabled={index === lessons.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs">▼</button>
                  </div>
                  <span className="w-6 text-center text-sm text-gray-400 font-mono">{index + 1}</span>
                  <span className="text-lg">{contentIcon(lesson.content_type || 'video')}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-[#0F1F3D] truncate">{lesson.title}</p>
                      {lesson.is_free && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Free</span>}
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full capitalize">{lesson.content_type}</span>
                    </div>
                    {lesson.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{lesson.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(lesson)} className="text-xs text-[#2563EB] font-medium">Edit</button>
                    <button onClick={() => handleDelete(lesson.id, lesson.title)} disabled={deleting === lesson.id}
                      className="text-xs text-red-500 font-medium disabled:opacity-40">
                      {deleting === lesson.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Section Modal */}
      {showSectionForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-[#0F1F3D]">Add Section (Topic)</h2>
              <button onClick={() => setShowSectionForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                Sections are the main topics of your course (e.g. "HTML Basics", "CSS & Layout"). Lessons go inside sections.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Title *</label>
                <input value={sectionForm.title} onChange={e => setSectionForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. HTML Basics"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={sectionForm.description} onChange={e => setSectionForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Structure of a web page"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowSectionForm(false)}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddSection} disabled={savingSection}
                className="flex-1 bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1D4ED8] disabled:opacity-60">
                {savingSection ? 'Saving...' : 'Add Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-[#0F1F3D]">{editingLesson ? 'Edit Lesson' : 'New Lesson'}</h2>
              <button onClick={() => { setShowForm(false); setUploadStatus('') }} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Introduction to HTML"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(shown to students)</span></label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="What will students learn in this lesson?"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none" />
              </div>

              {/* Section assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Section (Topic) {sections.length === 0 && <span className="text-amber-500 font-normal text-xs">— add sections first</span>}
                </label>
                {sections.length > 0 ? (
                  <select value={form.section_id}
                    onChange={e => setForm(f => ({ ...f, section_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white">
                    <option value="">— No section —</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    No sections yet. <button type="button" onClick={() => { setShowForm(false); setShowSectionForm(true) }} className="text-[#2563EB] hover:underline">Add a section first →</button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['video', 'pdf', 'file'] as const).map(type => (
                    <button key={type} onClick={() => { setForm(f => ({ ...f, content_type: type })); setUploadStatus('') }}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                        form.content_type === type ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {type === 'video' ? '🎬 Video' : type === 'pdf' ? '📄 PDF' : '📎 File'}
                    </button>
                  ))}
                </div>
              </div>

              {form.content_type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Video</label>
                  <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                  {!form.bunny_video_id ? (
                    <button onClick={() => videoInputRef.current?.click()} disabled={uploading}
                      className="w-full border-2 border-dashed border-gray-200 rounded-lg py-8 text-center hover:border-[#2563EB]/50 transition-colors disabled:opacity-60">
                      {uploading ? (
                        <div>
                          <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm text-gray-500">{uploadStatus}</p>
                          {uploadProgress > 0 && (
                            <div className="mt-2 mx-8">
                              <div className="bg-gray-200 rounded-full h-1.5">
                                <div className="bg-[#2563EB] h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }} />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{uploadProgress}%</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <><div className="text-3xl mb-2">🎬</div><p className="text-sm font-medium text-gray-700">Click to upload video</p><p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI supported</p></>
                      )}
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                      <div><p className="text-sm font-medium text-green-700">✓ Video uploaded</p><p className="text-xs text-gray-500 font-mono mt-0.5">{form.bunny_video_id}</p></div>
                      <button onClick={() => { setForm(f => ({ ...f, bunny_video_id: '' })); setUploadStatus('') }} className="text-xs text-red-500">Remove</button>
                    </div>
                  )}
                  {uploadStatus && !uploading && <p className={`text-xs mt-1 ${uploadStatus.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{uploadStatus}</p>}
                </div>
              )}

              {(form.content_type === 'pdf' || form.content_type === 'file') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{form.content_type === 'pdf' ? 'PDF File' : 'File'}</label>
                  <input ref={fileInputRef} type="file" accept={form.content_type === 'pdf' ? '.pdf' : '*'} onChange={handleFileUpload} className="hidden" />
                  {!form.file_url ? (
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="w-full border-2 border-dashed border-gray-200 rounded-lg py-8 text-center hover:border-[#2563EB]/50 transition-colors disabled:opacity-60">
                      {uploading
                        ? <><div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm text-gray-500">{uploadStatus}</p></>
                        : <><div className="text-3xl mb-2">{form.content_type === 'pdf' ? '📄' : '📎'}</div><p className="text-sm font-medium text-gray-700">Click to upload {form.content_type.toUpperCase()}</p></>}
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-green-700">✓ File uploaded</p>
                        <a href={getFileUrl(form.file_url)} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2563EB] hover:underline truncate block max-w-xs">Preview File →</a>
                      </div>
                      <button onClick={() => setForm(f => ({ ...f, file_url: '' }))} className="text-xs text-red-500 flex-shrink-0">Remove</button>
                    </div>
                  )}
                  {uploadStatus && !uploading && <p className={`text-xs mt-1 ${uploadStatus.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{uploadStatus}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (seconds)</label>
                <input type="number" value={form.duration_seconds}
                  onChange={e => setForm(f => ({ ...f, duration_seconds: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g. 300 for 5 minutes"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_free} onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))} className="w-4 h-4 accent-[#2563EB]" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Free preview</span>
                  <p className="text-xs text-gray-400">Non-enrolled users can access this lesson</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => { setShowForm(false); setUploadStatus('') }}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploading}
                className="flex-1 bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1D4ED8] disabled:opacity-60">
                {saving ? 'Saving...' : editingLesson ? 'Save Changes' : 'Add Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
