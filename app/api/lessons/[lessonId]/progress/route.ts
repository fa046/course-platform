import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // Upsert progress (insert or update)
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

    return NextResponse.json({ progress: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}