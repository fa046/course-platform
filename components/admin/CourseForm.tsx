'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Course } from '@/lib/types'

type Props = { initialData?: Course }

type BlogPost = {
  id: string
  title: string
  slug: string
  is_published: boolean
}

const BUNNY_PULL_ZONE = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net'

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

// ✅ Resolves any path/URL to a full displayable URL
function getImageUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) {
    if (path.includes('.storage.bunnycdn.com')) {
      const match = path.match(/\.storage\.bunnycdn\.com\/[^/]+\/(.+)/)
      return match ? `${BUNNY_PULL_ZONE}/${match[1]}` : path
    }
    return path
  }
  return `${BUNNY_PULL_ZONE}/${path.replace(/^\//, '')}`
}

export default function CourseForm({ initialData }: Props) {
  const router = useRouter()
  const isEditing = !!initialData
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    description: initialData?.description ?? '',
    thumbnail_url: initialData?.thumbnail_url ?? '',
    price_pkr: initialData?.price_pkr ?? 0,
    price_usd: initialData?.price_usd ?? 0,
    is_free: initialData?.is_free ?? false,
    is_published: initialData?.is_published ?? false,
    paddle_price_id: (initialData as any)?.paddle_price_id ?? '',
    related_blog_url: (initialData as any)?.related_blog_url ?? '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [blogMode, setBlogMode] = useState<'pick' | 'manual'>('pick')

  useEffect(() => {
    fetch('/api/admin/blog')
      .then(r => r.json())
      .then(data => setBlogPosts(data.posts ?? []))
      .catch(() => {})
  }, [])

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    set('title', title)
    if (!isEditing) set('slug', slugify(title))
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please select an image file')
    if (file.size > 5 * 1024 * 1024) return setError('Image must be under 5MB')
    setUploadingThumb(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'thumbnails')
      const res = await fetch('/api/admin/upload/image', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      // ✅ FIXED: save clean relative path e.g. "thumbnails/1234-img.jpg"
      // Use path field from API, or strip pull zone prefix from url
      const cleanPath = data.path || data.url.replace(BUNNY_PULL_ZONE + '/', '').replace(/^\//, '')
      set('thumbnail_url', cleanPath)
    } catch (err: any) {
      setError(err.message || 'Thumbnail upload failed')
    } finally {
      setUploadingThumb(false)
    }
  }

  const handleBlogPick = (slug: string) => {
    if (!slug) {
      set('related_blog_url', '')
      return
    }
    set('related_blog_url', `https://www.smartskillify.com/blog/${slug}`)
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.title.trim()) return setError('Title is required')
    if (!form.description.trim()) return setError('Description is required')
    if (!form.slug.trim()) return setError('Could not generate slug from title')
    setSaving(true)
    const res = await fetch(
      isEditing ? `/api/admin/courses/${initialData!.slug}` : '/api/admin/courses',
      {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }
    )
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Something went wrong'); setSaving(false); return }
    router.push('/admin/courses')
    router.refresh()
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"

  const selectedSlug = form.related_blog_url
    ? form.related_blog_url.replace('https://www.smartskillify.com/blog/', '')
    : ''

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title *</label>
          <input value={form.title} onChange={handleTitleChange}
            placeholder="e.g. Complete UI/UX Design Masterclass"
            className={inputClass} />
          {form.slug && (
            <p className="text-xs text-gray-400 mt-1">
              URL: /courses/<span className="font-mono text-gray-600">{form.slug}</span>
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={4} placeholder="Describe what students will learn..."
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none" />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Thumbnail</label>
          <div className="space-y-3">
            <div className="flex gap-3 items-center">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                disabled={uploadingThumb}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60">
                {uploadingThumb
                  ? <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Uploading...</>
                  : <>📁 Upload Image</>}
              </button>
              <span className="text-xs text-gray-400">or paste a URL below</span>
            </div>
            <input value={form.thumbnail_url} onChange={e => set('thumbnail_url', e.target.value)}
              placeholder="https://... or leave blank to upload above"
              className={inputClass} />
            {form.thumbnail_url && (
              <div className="relative group w-fit">
                {/* ✅ FIXED: use getImageUrl so relative paths display correctly */}
                <img
                  src={getImageUrl(form.thumbnail_url)}
                  alt="preview"
                  className="h-36 rounded-lg object-cover border border-gray-200"
                />
                <button onClick={() => set('thumbnail_url', '')}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs items-center justify-center hidden group-hover:flex">✕</button>
              </div>
            )}
          </div>
        </div>

        {/* Free toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_free} onChange={e => set('is_free', e.target.checked)} className="w-4 h-4 accent-[#2563EB]" />
          <div>
            <span className="text-sm font-medium text-gray-700">This is a free course</span>
            <p className="text-xs text-gray-400">Students can enroll without paying</p>
          </div>
        </label>

        {/* Pricing */}
        {!form.is_free && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (PKR)</label>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB]">
                  <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r border-gray-200">₨</span>
                  <input type="number" value={form.price_pkr}
                    onChange={e => set('price_pkr', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-2.5 text-sm text-gray-900 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD)</label>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB]">
                  <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r border-gray-200">$</span>
                  <input type="number" value={form.price_usd}
                    onChange={e => set('price_usd', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-2.5 text-sm text-gray-900 focus:outline-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Paddle Price ID</label>
              <input value={form.paddle_price_id} onChange={e => set('paddle_price_id', e.target.value)}
                placeholder="pri_xxxxxxxxxxxxxxxx"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
              <p className="text-xs text-gray-400 mt-1">Paddle Dashboard → Catalog → Prices</p>
            </div>
          </div>
        )}

        {/* Related Blog URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Related Blog Post <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex gap-2 mb-3">
            <button type="button"
              onClick={() => setBlogMode('pick')}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${blogMode === 'pick' ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              Pick from blog
            </button>
            <button type="button"
              onClick={() => setBlogMode('manual')}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${blogMode === 'manual' ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              Enter URL manually
            </button>
          </div>
          {blogMode === 'pick' ? (
            <div>
              <select value={selectedSlug} onChange={e => handleBlogPick(e.target.value)} className={inputClass}>
                <option value="">— No blog post linked —</option>
                {blogPosts.map(post => (
                  <option key={post.id} value={post.slug}>
                    {post.title}{!post.is_published ? ' (draft)' : ''}
                  </option>
                ))}
              </select>
              {form.related_blog_url && (
                <p className="text-xs text-gray-400 mt-1 font-mono truncate">{form.related_blog_url}</p>
              )}
              {blogPosts.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No blog posts yet.{' '}
                  <a href="/admin/blog/new" target="_blank" className="underline">Create one first →</a>
                </p>
              )}
            </div>
          ) : (
            <input value={form.related_blog_url} onChange={e => set('related_blog_url', e.target.value)}
              placeholder="https://www.smartskillify.com/blog/..."
              className={inputClass} />
          )}
          <p className="text-xs text-gray-400 mt-1">Shown as a link on the course page</p>
        </div>

        {/* Published */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} className="w-4 h-4 accent-[#2563EB]" />
          <div>
            <span className="text-sm font-medium text-gray-700">Publish this course</span>
            <p className="text-xs text-gray-400">Visible to students on the courses page</p>
          </div>
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()}
            className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="bg-[#2563EB] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors disabled:opacity-60">
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Course'}
          </button>
        </div>
      </div>
    </div>
  )
}