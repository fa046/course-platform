import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Fetch related posts (same category, exclude current)
  const { data: related } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, thumbnail_url, category, read_time, author_name, published_at, created_at')
    .eq('is_published', true)
    .eq('category', post.category || '')
    .neq('slug', slug)
    .limit(3)

  return NextResponse.json({ post, related: related || [] })
}
