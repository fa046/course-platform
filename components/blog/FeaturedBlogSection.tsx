'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BlogCard from '@/components/blog/BlogCard'

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

export default function FeaturedBlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/blog?featured=true')
      .then(r => r.json())
      .then(data => setPosts(data.posts || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (!loading && posts.length === 0) return null

  return (
    <section className="bg-[#f1f5f9] py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">From the Blog</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
              Latest Articles
            </h2>
            <p className="text-slate-500 mt-2 text-base">
              Practical tips, tutorials and insights to help you grow.
            </p>
          </div>
          <Link
            href="/blog"
            className="hidden sm:flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
          >
            View all articles
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-52 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-200 rounded-full w-full" />
                  <div className="h-3 bg-slate-200 rounded-full w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <BlogCard key={post.id} post={post} featured />
            ))}
          </div>
        )}

        {/* Mobile view all link */}
        <div className="sm:hidden text-center mt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-blue-600 font-semibold text-sm"
          >
            View all articles →
          </Link>
        </div>
      </div>
    </section>
  )
}
