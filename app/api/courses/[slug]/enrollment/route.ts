import { createAdminClient } from '@/lib/supabase/admin'
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

    const supabase = createAdminClient()

    // ── Admin bypass ──────────────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw profileError

    if (profile?.role === 'admin') {
      return NextResponse.json({ enrolled: true, isAdmin: true })
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { slug } = await params

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (courseError) throw courseError

    if (!course) {
      return NextResponse.json({ enrolled: false })
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle()

    if (enrollmentError) throw enrollmentError

    return NextResponse.json({ enrolled: !!enrollment })
  } catch (error) {
    console.error('Enrollment check failed:', error)
    return NextResponse.json({ error: 'Failed to check enrollment' }, { status: 500 })
  }
}