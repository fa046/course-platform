'use client'

import { useEffect, useState, useCallback } from 'react'
import BlogCard from '@/components/blog/BlogCard'

const CATEGORIES = ['All', 'Design', 'Development', 'Marketing', 'Business', 'Career', 'Tutorial']

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  thumbnail_url: string | null
  category: string | null
  tags: string[] | null
  read_time: number | null
  author_name: string | null
  author_avatar: string | null
  published_at: string | null
  created_at: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const LIMIT = 9

  const fetchPosts = useCallback(async (category: string, searchTerm: string, pageNum: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== 'All') params.set('category', category)
      params.set('limit', String(LIMIT))
      params.set('page', String(pageNum))
      const res = await fetch(`/api/blog?${params.toString()}`)
      const data = await res.json()
      const fetched: BlogPost[] = data.posts || []

      // Client-side search filter
      const filtered = searchTerm
        ? fetched.filter(p =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : fetched

      if (pageNum === 1) {
        setPosts(filtered)
      } else {
        setPosts(prev => [...prev, ...filtered])
      }
      setHasMore(fetched.length === LIMIT)
    } catch {
      console.error('Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    fetchPosts(activeCategory, search, 1)
  }, [activeCategory, search, fetchPosts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(activeCategory, search, nextPage)
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Hero */}
      <div className="bg-[#0f172a] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border border-blue-600/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              SmartSkillify Blog
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
              Learn, grow &{' '}
              <span className="text-blue-400">stay ahead.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Practical guides, tutorials, and insights on design, development, marketing and more.
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-8 flex gap-3 max-w-xl">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search articles..."
                className="w-full bg-white/10 border border-white/10 text-white placeholder-slate-400 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Active search indicator */}
        {search && (
          <div className="flex items-center gap-3 mb-6">
            <p className="text-slate-600 text-sm">
              Showing results for <span className="font-semibold text-slate-900">"{search}"</span>
            </p>
            <button
              onClick={() => { setSearch(''); setSearchInput('') }}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Clear
            </button>
          </div>
        )}

        {loading && posts.length === 0 ? (
          // Skeleton loader
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-200 rounded-full w-full" />
                  <div className="h-3 bg-slate-200 rounded-full w-5/6" />
                  <div className="flex justify-between pt-2">
                    <div className="h-3 bg-slate-200 rounded-full w-24" />
                    <div className="h-3 bg-slate-200 rounded-full w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No articles found</h3>
            <p className="text-slate-500 text-sm">
              {search ? 'Try a different search term.' : 'No articles in this category yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold px-8 py-3 rounded-xl text-sm transition-all duration-200 shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more articles'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
