import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendCourseCompletion } from '@/lib/email'

// GET /api/lessons/[lessonId]/progress
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    return NextResponse.json({
      progress: data || { is_completed: false, watch_percent: 0 }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/lessons/[lessonId]/progress
// Body: { course_id, watch_percent, is_completed }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId } = await params
    const { course_id, watch_percent, is_completed } = await request.json()

    if (!course_id) {
      return NextResponse.json({ error: 'course_id is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Was this lesson already completed before this request?
    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('is_completed')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    const wasAlreadyCompleted = existing?.is_completed ?? false

    // Upsert progress
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          course_id,
          watch_percent: watch_percent ?? 0,
          is_completed: is_completed ?? false,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Progress upsert error:', error)
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
    }

    // ── Check for course completion (only when a lesson is newly completed) ──
    // Skip if this lesson was already completed — avoids re-sending on every progress ping
    if (is_completed && !wasAlreadyCompleted) {
      try {
        const adminSupabase = createAdminClient()

        // Get total lessons and completed lessons for this course in parallel
        const [{ count: totalLessons }, { count: completedLessons }, { data: user }, { data: course }] =
          await Promise.all([
            adminSupabase
              .from('lessons')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course_id),
            adminSupabase
              .from('lesson_progress')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('course_id', course_id)
              .eq('is_completed', true),
            adminSupabase
              .from('users')
              .select('email, full_name')
              .eq('id', userId)
              .single(),
            adminSupabase
              .from('courses')
              .select('title, slug')
              .eq('id', course_id)
              .single(),
          ])

        // All lessons completed → send the email once
        if (
          totalLessons &&
          completedLessons &&
          completedLessons >= totalLessons &&
          user?.email &&
          course
        ) {
          await sendCourseCompletion({
            to: user.email,
            studentName: user.full_name || 'there',
            courseTitle: course.title,
            courseSlug: course.slug,
          })
        }
      } catch (emailError) {
        console.error('Course completion email failed:', emailError)
      }
    }

    return NextResponse.json({ progress: data })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}