import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId, isFree } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify course exists and is free
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, is_free, is_published')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (!course.is_free && !isFree) {
      return NextResponse.json({ error: 'This course requires payment' }, { status: 400 })
    }

    if (!course.is_published) {
      return NextResponse.json({ error: 'Course not available' }, { status: 400 })
    }

    // Create enrollment
    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert({ user_id: userId, course_id: courseId }, {
        onConflict: 'user_id,course_id',
        ignoreDuplicates: true,
      })

    if (enrollError) throw enrollError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 })
  }
}