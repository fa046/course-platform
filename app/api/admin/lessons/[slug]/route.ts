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
  const { data: course } = await supabase.from('courses').select('id, title').eq('slug', slug).single()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  const { data: lessons, error } = await supabase.from('lessons').select('*').eq('course_id', course.id).order('position', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lessons, courseTitle: course.title })
}

export async function POST(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const body = await request.json()
  const { title, description, content_type, bunny_video_id, file_url, duration_seconds, is_free, position, section_id } = body
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const supabase = createAdminClient()
  const { data: course } = await supabase.from('courses').select('id').eq('slug', slug).single()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  const { data, error } = await supabase.from('lessons').insert({
    course_id: course.id,
    title,
    description: description || null,
    content_type: content_type || 'video',
    bunny_video_id: bunny_video_id || null,
    file_url: file_url || null,
    video_url: null,
    duration_seconds: duration_seconds || 0,
    is_free: is_free ?? false,
    position: position || 1,
    section_id: section_id || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data }, { status: 201 })
}

export async function PUT(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const body = await request.json()
  const { id, title, description, content_type, bunny_video_id, file_url, duration_seconds, is_free, section_id } = body
  if (!id || !title) return NextResponse.json({ error: 'ID and title required' }, { status: 400 })
  const supabase = createAdminClient()
  const { data: course } = await supabase.from('courses').select('id').eq('slug', slug).single()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  const { data, error } = await supabase.from('lessons').update({
    title,
    description: description || null,
    content_type: content_type || 'video',
    bunny_video_id: bunny_video_id || null,
    file_url: file_url || null,
    duration_seconds: duration_seconds || 0,
    is_free: is_free ?? false,
    section_id: section_id || null,
  }).eq('id', id).eq('course_id', course.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}

export async function DELETE(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 })
  const supabase = createAdminClient()
  const { data: course } = await supabase.from('courses').select('id').eq('slug', slug).single()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  const { error } = await supabase.from('lessons').delete().eq('id', id).eq('course_id', course.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
