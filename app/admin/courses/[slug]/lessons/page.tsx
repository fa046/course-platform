'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Lesson } from '@/lib/types'

type LessonForm = {
  title: string
  description: string
  content_type: 'video' | 'pdf' | 'file'
  bunny_video_id: string
  file_url: string
  duration_seconds: number
  is_free: boolean
}

const emptyForm: LessonForm = {
  title: '', description: '', content_type: 'video',
  bunny_video_id: '', file_url: '', duration_seconds: 0, is_free: false,
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
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const videoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchLessons = async () => {
    const r = await fetch(`/api/admin/lessons/${slug}`)
    const data = await r.json()
    setLessons(data.lessons ?? [])
    setCourseTitle(data.courseTitle ?? '')
    setLoading(false)
  }

  useEffect(() => { fetchLessons() }, [slug])

  const openNew = () => { setEditingLesson(null); setForm(emptyForm); setShowForm(true) }

  const openEdit = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setForm({
      title: lesson.title,
      description: lesson.description ?? '',
      content_type: lesson.content_type || 'video',
      bunny_video_id: lesson.bunny_video_id ?? '',
      file_url: lesson.file_url ?? '',
      duration_seconds: lesson.duration_seconds,
      is_free: lesson.is_free,
    })
    setShowForm(true)
  }

  // Upload video to Bunny Stream
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setUploadStatus('Creating video on Bunny Stream...')

    try {
      // Step 1: Get upload URL from Bunny
      const res = await fetch('/api/lessons/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title || file.name }),
      })
      const { videoId, uploadUrl, apiKey } = await res.json()
      if (!videoId) throw new Error('Failed to get upload URL')

      setUploadStatus('Uploading video...')

      // Step 2: Upload directly to Bunny
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error('Upload failed'))
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('AccessKey', apiKey)
        xhr.send(file)
      })

      setUploadStatus('✓ Video uploaded successfully!')
      setForm(f => ({ ...f, bunny_video_id: videoId }))
    } catch (err: any) {
      setUploadStatus('✗ Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  // Upload PDF/file to Bunny Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadStatus('Uploading file...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'lessons')

      const res = await fetch('/api/admin/upload/file', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setForm(f => ({ ...f, file_url: data.url }))
      setUploadStatus('✓ File uploaded successfully!')
    } catch (err: any) {
      setUploadStatus('✗ Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Title is required')
    setSaving(true)
    const method = editingLesson ? 'PUT' : 'POST'
    const body = editingLesson
      ? { ...form, id: editingLesson.id }
      : { ...form, position: lessons.length + 1 }

    await fetch(`/api/admin/lessons/${slug}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    await fetchLessons()
    setShowForm(false)
    setSaving(false)
    setUploadStatus('')
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete lesson "${title}"?`)) return
    setDeleting(id)
    await fetch(`/api/admin/lessons/${slug}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
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
    setLessons(newLessons)
    await fetch(`/api/admin/lessons/${slug}/reorder`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessons: newLessons.map((l, i) => ({ id: l.id, position: i + 1 })) }),
    })
  }

  const contentIcon = (type: string) => type === 'pdf' ? '📄' : type === 'file' ? '📎' : '🎬'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/admin/courses" className="hover:text-[#2563EB]">Courses</Link>
            <span>/</span><span>{courseTitle}</span>
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
            <button onClick={openNew} className="text-[#2563EB] text-sm mt-2 hover:underline">Add your first lesson →</button>
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
                <span className="text-lg">{contentIcon(lesson.content_type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-[#0F1F3D] truncate">{lesson.title}</p>
                    {lesson.is_free && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Free</span>}
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full capitalize">{lesson.content_type}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {lesson.bunny_video_id && <p className="text-xs text-gray-400 font-mono truncate">🎬 {lesson.bunny_video_id.slice(0, 20)}...</p>}
                    {lesson.file_url && <p className="text-xs text-gray-400 truncate">📎 File attached</p>}
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
            ))}
          </div>
        )}
      </div>

      {/* Lesson Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-[#0F1F3D]">{editingLesson ? 'Edit Lesson' : 'New Lesson'}</h2>
              <button onClick={() => { setShowForm(false); setUploadStatus('') }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Introduction to UI/UX"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Brief description..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none" />
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['video', 'pdf', 'file'] as const).map(type => (
                    <button key={type} onClick={() => { setForm(f => ({ ...f, content_type: type })); setUploadStatus('') }}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                        form.content_type === type
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {type === 'video' ? '🎬 Video' : type === 'pdf' ? '📄 PDF' : '📎 File'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Upload */}
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
                                <div className="bg-[#2563EB] h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{uploadProgress}%</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="text-3xl mb-2">🎬</div>
                          <p className="text-sm font-medium text-gray-700">Click to upload video</p>
                          <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI supported</p>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">✓ Video uploaded</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{form.bunny_video_id}</p>
                      </div>
                      <button onClick={() => { setForm(f => ({ ...f, bunny_video_id: '' })); setUploadStatus('') }}
                        className="text-xs text-red-500 hover:text-red-600">Remove</button>
                    </div>
                  )}
                  {uploadStatus && !uploading && (
                    <p className={`text-xs mt-1 ${uploadStatus.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{uploadStatus}</p>
                  )}
                </div>
              )}

              {/* PDF/File Upload */}
              {(form.content_type === 'pdf' || form.content_type === 'file') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {form.content_type === 'pdf' ? 'PDF File' : 'File'}
                  </label>
                  <input ref={fileInputRef} type="file"
                    accept={form.content_type === 'pdf' ? '.pdf' : '*'}
                    onChange={handleFileUpload} className="hidden" />
                  {!form.file_url ? (
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="w-full border-2 border-dashed border-gray-200 rounded-lg py-8 text-center hover:border-[#2563EB]/50 transition-colors disabled:opacity-60">
                      {uploading ? (
                        <div>
                          <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm text-gray-500">{uploadStatus}</p>
                        </div>
                      ) : (
                        <>
                          <div className="text-3xl mb-2">{form.content_type === 'pdf' ? '📄' : '📎'}</div>
                          <p className="text-sm font-medium text-gray-700">Click to upload {form.content_type.toUpperCase()}</p>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">✓ File uploaded</p>
                        <a href={form.file_url} target="_blank" className="text-xs text-[#2563EB] hover:underline">Preview →</a>
                      </div>
                      <button onClick={() => setForm(f => ({ ...f, file_url: '' }))}
                        className="text-xs text-red-500 hover:text-red-600">Remove</button>
                    </div>
                  )}
                  {uploadStatus && !uploading && (
                    <p className={`text-xs mt-1 ${uploadStatus.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{uploadStatus}</p>
                  )}
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (seconds)</label>
                <input type="number" value={form.duration_seconds}
                  onChange={e => setForm(f => ({ ...f, duration_seconds: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g. 300 for 5 minutes"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
              </div>

              {/* Free preview */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_free}
                  onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))}
                  className="w-4 h-4 accent-[#2563EB]" />
                <div>
                  <span className="text-sm font-medium text-gray-700">Free preview</span>
                  <p className="text-xs text-gray-400">Non-enrolled users can access this</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => { setShowForm(false); setUploadStatus('') }}
                className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || uploading}
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