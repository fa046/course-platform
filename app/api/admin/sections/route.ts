import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

function isAdmin(userId: string | null) {
  return userId && userId === process.env.ADMIN_USER_ID
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { course_id, title, description, position } = await request.json()
  if (!course_id || !title) return NextResponse.json({ error: 'course_id and title required' }, { status: 400 })
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('course_sections').insert({
    course_id, title, description: description || null, position: position || 1,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ section: data }, { status: 201 })
}
