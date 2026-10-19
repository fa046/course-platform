import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('course_id, courses(*)')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    if (error) throw error

    const courses = enrollments?.map(e => e.courses).filter(Boolean) || []

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Dashboard course query failed:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}