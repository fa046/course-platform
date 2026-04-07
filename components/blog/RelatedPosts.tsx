import Link from 'next/link'

interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  thumbnail_url: string | null
  category: string | null
  read_time: number | null
  author_name: string | null
  published_at: string | null
  created_at: string
}

interface RelatedPostsProps {
  posts: RelatedPost[]
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null

  return (
    <section className="mt-16 pt-12 border-t border-slate-100">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">Related Articles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => {
          const displayDate = post.published_at || post.created_at
          const formattedDate = new Date(displayDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })

          return (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300 h-full flex flex-col">
                <div className="relative w-full h-40 bg-gradient-to-br from-blue-50 to-slate-100 overflow-hidden flex-shrink-0">
                  {post.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.thumbnail_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {post.category && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 flex-1 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span>{post.author_name || 'SmartSkillify'}</span>
                    <div className="flex items-center gap-2">
                      {post.read_time && <span>{post.read_time} min</span>}
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
