'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type BlogPostForm = {
  title: string
  slug: string
  excerpt: string
  content: string
  thumbnail_url: string
  category: string
  tags: string
  read_time: number
  author_name: string
  is_published: boolean
}

const CATEGORIES = ['Design', 'Development', 'Marketing', 'Business', 'Career', 'Tutorial']
const BUNNY_PULL_ZONE = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net'

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

type Props = {
  initialData?: Partial<BlogPostForm> & { id?: string }
}

export default function BlogPostForm({ initialData }: Props) {
  const router = useRouter()
  const isEditing = !!initialData?.id
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<BlogPostForm>({
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    excerpt: initialData?.excerpt ?? '',
    content: initialData?.content ?? '',
    thumbnail_url: initialData?.thumbnail_url ?? '',
    category: initialData?.category ?? '',
    tags: Array.isArray(initialData?.tags) ? (initialData.tags as string[]).join(', ') : (initialData?.tags ?? ''),
    read_time: initialData?.read_time ?? 5,
    author_name: initialData?.author_name ?? 'SmartSkillify',
    is_published: initialData?.is_published ?? false,
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingThumb, setUploadingThumb] = useState(false)

  const set = (key: keyof BlogPostForm, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    set('title', title)
    if (!isEditing) set('slug', slugify(title))
  }

  // ✅ Helper: build full preview URL from a relative path or full URL
  const getPreviewUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    return `${BUNNY_PULL_ZONE}/${path.replace(/^\//, '')}`
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumb(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'blog')
      const res = await fetch('/api/admin/upload/image', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      // ✅ FIXED: API now returns path field directly, or we strip the pull zone prefix
      // Saves a clean relative path like "blog/1234567890-img.jpg"
      const cleanPath = data.path || data.url.replace(BUNNY_PULL_ZONE + '/', '').replace(/^\//, '')
      set('thumbnail_url', cleanPath)
    } catch (err: any) {
      setError(err.message || 'Thumbnail upload failed')
    } finally {
      setUploadingThumb(false)
    }
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.title.trim()) return setError('Title is required')
    if (!form.content.trim()) return setError('Content is required')

    setSaving(true)

    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      read_time: Number(form.read_time),
    }

    const url = isEditing ? `/api/admin/blog/${initialData!.id}` : '/api/admin/blog'
    const method = isEditing ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      setSaving(false)
      return
    }

    router.push('/admin/blog')
    router.refresh()
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"

  return (
    <div className="max-w-3xl pb-20">
      <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6 shadow-sm">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Post Title *</label>
          <input value={form.title} onChange={handleTitleChange}
            placeholder="e.g. Getting Started with UI/UX Design in 2025"
            className={inputClass} />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug</label>
          <input value={form.slug} onChange={e => set('slug', e.target.value)}
            className={`${inputClass} font-mono bg-gray-50`} />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Thumbnail</label>
          <div className="space-y-3">
            <div className="flex gap-3 items-center">
              <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
              <button type="button" onClick={() => thumbInputRef.current?.click()}
                disabled={uploadingThumb}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60">
                {uploadingThumb ? 'Uploading...' : '📁 Upload Image'}
              </button>
            </div>
            {form.thumbnail_url && (
              <div className="relative group w-fit">
                {/* ✅ FIXED: use getPreviewUrl so relative paths render correctly */}
                <img
                  src={getPreviewUrl(form.thumbnail_url)}
                  alt="preview"
                  className="h-32 rounded-lg object-cover border border-gray-200"
                />
                <button type="button" onClick={() => set('thumbnail_url', '')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow-lg">✕</button>
              </div>
            )}
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt</label>
          <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
            rows={2} className={`${inputClass} resize-none`} />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Content * <span className="text-gray-400 font-normal ml-2">(Paste formatted text from Word/Docs)</span>
          </label>
          <div
            contentEditable
            onBlur={(e) => set('content', e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: initialData?.content || '' }}
            className="w-full border border-gray-200 rounded-lg px-4 py-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] min-h-[450px] bg-white overflow-y-auto prose max-w-none"
          />
        </div>

        {/* Category + Read time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass}>
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Read Time (min)</label>
            <input type="number" value={form.read_time} onChange={e => set('read_time', e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Status */}
        <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border border-gray-100">
          <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} className="w-4 h-4 accent-[#2563EB]" />
          <div>
            <span className="text-sm font-medium text-gray-700">Publish this post</span>
            <p className="text-xs text-gray-400">Make it visible to everyone</p>
          </div>
        </label>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

        <div className="flex gap-3 pt-4 border-t">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-8 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </div>
    </div>
  )
}