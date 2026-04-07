'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Define the Pull Zone URL
const BUNNY_PULL_ZONE = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net';

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  thumbnail_url: string | null
  is_published: boolean
  category: string | null
  created_at: string
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPosts = async () => {
    const res = await fetch('/api/admin/blog')
    const data = await res.json()
    setPosts(data.posts ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  // --- IMAGE URL HELPER ---
  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    
    // 1. Fix old storage URLs on the fly
    if (path.includes('sg.storage.bunnycdn.com')) {
      return path.replace('https://sg.storage.bunnycdn.com/smartlearn', BUNNY_PULL_ZONE);
    }
    
    // 2. If it's a clean relative path (new way), add the CDN domain
    if (!path.startsWith('http')) {
      return `${BUNNY_PULL_ZONE}/${path}`;
    }
    
    return path;
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(id)
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
    await fetchPosts()
    setDeleting(null)
  }

  const handleTogglePublish = async (post: BlogPost) => {
    await fetch(`/api/admin/blog/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...post, is_published: !post.is_published }),
    })
    await fetchPosts()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1F3D]">Blog Posts</h1>
          <p className="text-gray-500 mt-1">{posts.length} post{posts.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/admin/blog/new"
          className="bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors">
          + New Post
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✍️</p>
            <p className="text-gray-500 text-sm">No blog posts yet.</p>
            <Link href="/admin/blog/new" className="text-[#2563EB] text-sm mt-2 inline-block hover:underline">
              Write your first post →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {posts.map(post => (
              <div key={post.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                  {post.thumbnail_url ? (
                    <img 
                      src={getImageUrl(post.thumbnail_url) || ''} 
                      alt={post.title} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">✍️</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm text-[#0F1F3D] truncate">{post.title}</p>
                    {post.category && (
                      <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate font-mono">/blog/{post.slug}</p>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePublish(post)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      post.is_published
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    {post.is_published ? 'Published' : 'Draft'}
                  </button>
                  <span className="text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/blog/${post.id}/edit`}
                      className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors">
                      Edit
                    </Link>
                    <Link href={`/blog/${post.slug}`} target="_blank"
                      className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      disabled={deleting === post.id}
                      className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-40 transition-colors">
                      {deleting === post.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-medium text-blue-800 mb-1">💡 Linking blog posts to courses</p>
        <p className="text-xs text-blue-600 leading-relaxed">
          After publishing a post, copy its URL and paste it into the course form's "Related Blog URL" field to create a connection.
        </p>
      </div>
    </div>
  )
}