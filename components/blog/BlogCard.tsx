'use client'

import Link from 'next/link'

const BUNNY_PULL_ZONE = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net'

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

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const displayDate = post.published_at || post.created_at
  const formattedDate = new Date(displayDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  // ✅ FIXED: clean unified URL resolver
  // Handles all cases: relative paths, full CDN URLs, legacy storage URLs, external URLs
  const getFullImageUrl = (path: string | null): string | null => {
    if (!path) return null

    // Full URL cases
    if (path.startsWith('http')) {
      // Legacy records saved before env fix: private storage URL → swap to pull zone
      if (path.includes('.storage.bunnycdn.com')) {
        // Extract everything after the storage zone name
        const match = path.match(/\.storage\.bunnycdn\.com\/[^/]+\/(.+)/)
        return match ? `${BUNNY_PULL_ZONE}/${match[1]}` : path
      }
      // Already a correct CDN or external URL
      return path
    }

    // Relative path like "blog/123-img.jpg" or "thumbnails/123-img.jpg"
    return `${BUNNY_PULL_ZONE}/${path.replace(/^\//, '')}`
  }

  const imageUrl = getFullImageUrl(post.thumbnail_url)

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full border border-gray-100">
          <div className="relative w-full h-52 bg-gradient-to-br from-blue-50 to-slate-100 overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            )}
            {post.category && (
              <div className="absolute top-3 left-3">
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {post.category}
                </span>
              </div>
            )}
          </div>

          <div className="p-5">
            <h3 className="font-bold text-slate-900 text-lg leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                  {(post.author_name || 'S')[0]}
                </div>
                <span>{post.author_name || 'SmartSkillify'}</span>
              </div>
              <div className="flex items-center gap-3">
                {post.read_time && <span>{post.read_time} min read</span>}
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col h-full">
        <div className="relative w-full h-48 bg-gradient-to-br from-blue-50 to-slate-100 overflow-hidden flex-shrink-0">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          )}
          {post.category && (
            <div className="absolute top-3 left-3">
              <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {post.category}
              </span>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
              {post.excerpt}
            </p>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                {(post.author_name || 'S')[0]}
              </div>
              <span>{post.author_name || 'SmartSkillify'}</span>
            </div>
            <div className="flex items-center gap-3">
              {post.read_time && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {post.read_time} min
                </span>
              )}
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}