'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Course } from '@/lib/types'

type Props = {
  initialData?: Course
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function CourseForm({ initialData }: Props) {
  const router = useRouter()
  const isEditing = !!initialData

  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    description: initialData?.description ?? '',
    thumbnail_url: initialData?.thumbnail_url ?? '',
    price_pkr: initialData?.price_pkr ?? 0,
    price_usd: initialData?.price_usd ?? 0,
    is_free: initialData?.is_free ?? false,
    is_published: initialData?.is_published ?? false,
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    set('title', title)
    if (!isEditing) {
      set('slug', slugify(title))
    }
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.title.trim()) return setError('Title is required')
    if (!form.slug.trim()) return setError('Slug is required')
    if (!form.description.trim()) return setError('Description is required')

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

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setSaving(false)
      return
    }

    router.push('/admin/courses')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title *</label>
          <input
            value={form.title}
            onChange={handleTitleChange}
            placeholder="e.g. Complete Web Development Bootcamp"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug *</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB]">
            <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 whitespace-nowrap">
              /courses/
            </span>
            <input
              value={form.slug}
              onChange={e => set('slug', e.target.value)}
              placeholder="course-slug"
              className="flex-1 px-4 py-2.5 text-sm focus:outline-none font-mono"
            />
          </div>
          {isEditing && (
            <p className="text-xs text-amber-600 mt-1">⚠ Changing the slug will break existing links</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
            placeholder="Describe what students will learn in this course..."
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none"
          />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Thumbnail URL</label>
          <input
            value={form.thumbnail_url}
            onChange={e => set('thumbnail_url', e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
          {form.thumbnail_url && (
            <img src={form.thumbnail_url} alt="preview" className="mt-2 h-32 rounded-lg object-cover" />
          )}
        </div>

        {/* Free toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_free}
            onChange={e => set('is_free', e.target.checked)}
            className="w-4 h-4 accent-[#2563EB]"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">This is a free course</span>
            <p className="text-xs text-gray-400">Students can enroll without paying</p>
          </div>
        </label>

        {/* Pricing — only show if not free */}
        {!form.is_free && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (PKR) *</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB]">
                <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">₨</span>
                <input
                  type="number"
                  value={form.price_pkr}
                  onChange={e => set('price_pkr', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD) *</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB]/20 focus-within:border-[#2563EB]">
                <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">$</span>
                <input
                  type="number"
                  value={form.price_usd}
                  onChange={e => set('price_usd', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Published toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={e => set('is_published', e.target.checked)}
            className="w-4 h-4 accent-[#2563EB]"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Publish this course</span>
            <p className="text-xs text-gray-400">Visible to students on the courses page</p>
          </div>
        </label>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#2563EB] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors disabled:opacity-60">
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Course'}
          </button>
        </div>
      </div>
    </div>
  )
}