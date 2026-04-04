import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/courses/[slug]/progress
// Returns overall course completion % for the logged-in user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const supabase = await createClient()

    // Get the course id from slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Count total lessons
    const { count: totalLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', course.id)

    // Count completed lessons for this user
    const { count: completedLessons } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .eq('is_completed', true)

    const total = totalLessons || 0
    const completed = completedLessons || 0
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0

    return NextResponse.json({
      total_lessons: total,
      completed_lessons: completed,
      percent,
      is_course_complete: total > 0 && completed === total,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}