import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

function isAdmin(userId: string | null) {
  return userId && userId === process.env.ADMIN_USER_ID
}

export async function GET() {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ courses })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, slug, description, thumbnail_url, price_pkr, price_usd, is_free, is_published, paddle_price_id, related_blog_url } = body

  if (!title || !slug || !description) {
    return NextResponse.json({ error: 'Title, slug and description are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: existing } = await supabase.from('courses').select('id').eq('slug', slug).single()
  if (existing) return NextResponse.json({ error: 'Slug already in use' }, { status: 400 })

  const { data, error } = await supabase
    .from('courses')
    .insert({ title, slug, description, thumbnail_url, price_pkr, price_usd, is_free, is_published, paddle_price_id, related_blog_url })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course: data }, { status: 201 })
}
