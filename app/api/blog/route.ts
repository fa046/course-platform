import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  const limit = parseInt(searchParams.get('limit') || '12')
  const page = parseInt(searchParams.get('page') || '1')
  const featured = searchParams.get('featured') // for homepage

  const supabase = await createClient()

  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, thumbnail_url, category, tags, read_time, author_name, author_avatar, published_at, created_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (tag) {
    query = query.contains('tags', [tag])
  }

  if (featured === 'true') {
    query = query.limit(3)
  } else {
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data, count })
}
