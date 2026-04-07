import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TableOfContents from '@/components/blog/TableOfContents'
import ShareButtons from '@/components/blog/ShareButtons'
import RelatedPosts from '@/components/blog/RelatedPosts'

interface Props {
  params: Promise<{ slug: string }>
}

// Generate SEO metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, thumbnail_url, meta_title, meta_description, author_name, published_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || '',
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      images: post.thumbnail_url ? [post.thumbnail_url] : [],
      type: 'article',
      publishedTime: post.published_at || undefined,
      authors: post.author_name ? [post.author_name] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      images: post.thumbnail_url ? [post.thumbnail_url] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !post) notFound()

  // Fetch related posts
  const { data: related } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, thumbnail_url, category, read_time, author_name, published_at, created_at')
    .eq('is_published', true)
    .eq('category', post.category || '')
    .neq('slug', slug)
    .limit(3)

  const displayDate = post.published_at || post.created_at
  const formattedDate = new Date(displayDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Hero / Header */}
      <div className="bg-[#0f172a] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            {post.category && (
              <>
                <span>/</span>
                <Link href={`/blog?category=${post.category}`} className="hover:text-white transition-colors">
                  {post.category}
                </Link>
              </>
            )}
          </div>

          {/* Category badge */}
          {post.category && (
            <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              {post.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-4xl mb-6">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            {/* Author */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {(post.author_name || 'S')[0]}
              </div>
              <span className="text-white font-medium">{post.author_name || 'SmartSkillify Team'}</span>
            </div>

            <span className="text-slate-600">·</span>
            <span>{formattedDate}</span>

            {post.read_time && (
              <>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {post.read_time} min read
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail — using img tag to avoid next/image domain configuration issues */}
      {post.thumbnail_url && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6">
          <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Article Content */}
          <article className="flex-1 min-w-0">
            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-lg text-slate-600 leading-relaxed mb-8 font-medium border-l-4 border-blue-600 pl-5 bg-white rounded-r-xl py-4 pr-4">
                {post.excerpt}
              </p>
            )}

            {/* Content */}
            <div
              id="blog-content"
              className="prose prose-slate prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-slate-900
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-slate-800
                prose-code:bg-slate-100 prose-code:text-blue-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl
                prose-img:rounded-xl prose-img:shadow-md
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-4
                prose-ul:text-slate-600 prose-ol:text-slate-600
                prose-li:my-1
              "
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-slate-200">
                <span className="text-sm text-slate-500 font-medium self-center">Tags:</span>
                {post.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="text-sm bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 px-3 py-1.5 rounded-full transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Share Buttons */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <ShareButtons title={post.title} slug={post.slug} />
            </div>

            {/* Author Bio */}
            {post.author_name && (
              <div className="mt-10 bg-white rounded-2xl p-6 border border-gray-100 flex items-start gap-5">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl flex-shrink-0">
                  {post.author_name[0]}
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Written by</p>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{post.author_name}</h3>
                  {post.author_bio && (
                    <p className="text-slate-500 text-sm leading-relaxed">{post.author_bio}</p>
                  )}
                </div>
              </div>
            )}

            {/* Related Posts */}
            <RelatedPosts posts={related || []} />

            {/* CTA */}
            <div className="mt-16 bg-gradient-to-br from-[#0f172a] to-blue-900 rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-3">Ready to level up your skills?</h3>
              <p className="text-slate-300 mb-6 text-sm">
                Browse our expert-led courses and start learning today.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Browse Courses →
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:w-72 xl:w-80 flex-shrink-0">
            <TableOfContents contentId="blog-content" />
          </aside>
        </div>
      </div>
    </div>
  )
}
