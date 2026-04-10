'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Course } from '@/lib/types'

const BUNNY_PULL_ZONE = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net'

function getFullImageUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) {
    if (path.includes('.storage.bunnycdn.com')) {
      const match = path.match(/\.storage\.bunnycdn\.com\/[^/]+\/(.+)/)
      return match ? `${BUNNY_PULL_ZONE}/${match[1]}` : path
    }
    return path
  }
  return `${BUNNY_PULL_ZONE}/${path.replace(/^\//, '')}`
}

const levels = ['All', 'Beginner', 'Intermediate', 'Advanced']
const categories = ['All', 'Design', 'Development', 'Marketing', 'Business']

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showFreeOnly, setShowFreeOnly] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [showFreeOnly])

  async function fetchCourses() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (showFreeOnly) params.set('free', 'true')
      const res = await fetch(`/api/courses?${params}`)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = courses.filter(course => {
    const matchSearch = course.title.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  return (
    <main className="min-h-screen bg-[#F8F9FF]">

      {/* Header */}
      <div className="bg-[#0F1F3D] pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            All Courses
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-xl">
            Expand your skills with expert-led courses. Learn at your own pace.
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg">⌕</span>
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-[#2563EB] focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <button
            onClick={() => setShowFreeOnly(!showFreeOnly)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              showFreeOnly
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-white text-[#0F1F3D]/70 border-[#0F1F3D]/15 hover:border-[#2563EB]/50'
            }`}>
            Free Only
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0F1F3D] text-white border-[#0F1F3D]'
                  : 'bg-white text-[#0F1F3D]/70 border-[#0F1F3D]/15 hover:border-[#0F1F3D]/40'
              }`}>
              {cat}
            </button>
          ))}
          {levels.filter(l => l !== 'All').map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(selectedLevel === level ? 'All' : level)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                selectedLevel === level
                  ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30'
                  : 'bg-white text-[#0F1F3D]/70 border-[#0F1F3D]/15 hover:border-[#2563EB]/30'
              }`}>
              {level}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-[#64748B] mb-6">
          {loading ? 'Loading...' : `${filtered.length} course${filtered.length !== 1 ? 's' : ''} found`}
        </p>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(null).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#0F1F3D]/8 animate-pulse">
                <div className="aspect-video bg-[#0F1F3D]/5" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-[#0F1F3D]/5 rounded w-1/3" />
                  <div className="h-4 bg-[#0F1F3D]/5 rounded w-full" />
                  <div className="h-4 bg-[#0F1F3D]/5 rounded w-3/4" />
                  <div className="h-3 bg-[#0F1F3D]/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-[#0F1F3D] mb-2">No courses found</h3>
            <p className="text-[#64748B]">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`}
                className="group bg-white border border-[#0F1F3D]/8 rounded-2xl overflow-hidden hover:border-[#2563EB]/30 hover:shadow-xl hover:shadow-[#2563EB]/8 transition-all hover:-translate-y-1">
                <div className="aspect-video bg-gradient-to-br from-[#2563EB]/8 to-[#93C5FD]/15 relative flex items-center justify-center overflow-hidden">
                  {getFullImageUrl(course.thumbnail_url) ? (
                    <img
                      src={getFullImageUrl(course.thumbnail_url)!}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                      <span className="text-[#2563EB] text-xl">▶</span>
                    </div>
                  )}
                  {course.is_free && (
                    <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Free
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-sm leading-snug mb-2 text-[#0F1F3D] group-hover:text-[#2563EB] transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-[#64748B] mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#0F1F3D]/8">
                    {course.is_free ? (
                      <span className="text-emerald-600 font-semibold text-sm">Free</span>
                    ) : (
                      <div>
                        <span className="text-[#0F1F3D] font-semibold text-sm">Rs. {course.price_pkr?.toLocaleString()}</span>
                        <span className="text-[#64748B] text-xs ml-1">/ ${course.price_usd}</span>
                      </div>
                    )}
                    <span className="text-xs text-[#2563EB] group-hover:translate-x-1 transition-transform inline-block">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}