import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

function isAdmin(userId: string | null) {
  return userId && userId === process.env.ADMIN_USER_ID
}

type Params = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: course, error } = await supabase.from('courses').select('*').eq('slug', slug).single()
  if (error || !course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  const { data: sections } = await supabase
    .from('course_sections')
    .select('id, title, position')
    .eq('course_id', course.id)
    .order('position', { ascending: true })
  return NextResponse.json({ course: { ...course, sections: sections ?? [] } })
}

export async function PUT(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const body = await request.json()
  const { title, slug: newSlug, description, thumbnail_url, price_pkr, price_usd, is_free, is_published, paddle_price_id, related_blog_url } = body
  if (!title || !newSlug || !description) return NextResponse.json({ error: 'Title, slug and description are required' }, { status: 400 })
  const supabase = createAdminClient()
  if (newSlug !== slug) {
    const { data: existing } = await supabase.from('courses').select('id').eq('slug', newSlug).single()
    if (existing) return NextResponse.json({ error: 'Slug already in use' }, { status: 400 })
  }
  const { data, error } = await supabase.from('courses').update({
    title, slug: newSlug, description, thumbnail_url, price_pkr, price_usd,
    is_free, is_published, paddle_price_id, related_blog_url,
  }).eq('slug', slug).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course: data })
}

export async function PATCH(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const body = await request.json()
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('courses').update(body).eq('slug', slug).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course: data })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from('courses').delete().eq('slug', slug)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
