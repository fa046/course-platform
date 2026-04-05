import { createAdminClient } from '@/lib/supabase/admin'
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, isFree, fullName, phone, city } = body

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ── Ensure user exists in Supabase (safety net) ────────────────────────
    const clerkUser = await currentUser()
    if (clerkUser) {
      const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? ''
      const clerkName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null
      await supabase.from('users').upsert({
        id: userId,
        email,
        full_name: fullName || clerkName,
        avatar_url: clerkUser.imageUrl ?? null,
        role: 'student',
      }, { onConflict: 'id' })
    }

    // ── Verify course ────────────────────────────────────────────────────────
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, is_free, is_published')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (!course.is_published) {
      return NextResponse.json({ error: 'Course not available' }, { status: 400 })
    }

    // Block free bypass for paid courses (unless payment gateway confirms)
    if (!course.is_free && isFree) {
      return NextResponse.json({ error: 'This course requires payment' }, { status: 400 })
    }

    // ── Create enrollment with form data ────────────────────────────────────
    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          full_name: fullName || null,
          phone: phone || null,
          city: city || null,
        },
        { onConflict: 'user_id,course_id', ignoreDuplicates: true }
      )

    if (enrollError) {
      console.error('Enrollment error:', enrollError)
      return NextResponse.json(
        { error: 'Enrollment failed', detail: enrollError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Enroll route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}