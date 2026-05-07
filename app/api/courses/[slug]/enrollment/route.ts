import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ enrolled: false })
    }

    const supabase = await createClient()

    // ── Admin bypass ──────────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.json({ enrolled: true, isAdmin: true })
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { slug } = await params

    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!course) {
      return NextResponse.json({ enrolled: false })
    }

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .single()

    return NextResponse.json({ enrolled: !!enrollment })
  } catch (error) {
    return NextResponse.json({ enrolled: false })
  }
}