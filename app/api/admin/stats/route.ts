import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

async function isAdmin(userId: string | null) {
  if (!userId) return false

  const supabase = createAdminClient()

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return data?.role === 'admin'
}

export async function GET() {
  const { userId } = await auth()

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const [
    { count: totalCourses },
    { count: totalEnrollments },
    { count: totalStudents },
    { count: pendingPayments },
    { data: payments },
    { data: recentEnrollments },
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase
      .from('local_payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('local_payments')
      .select('amount')
      .eq('status', 'approved'),
    supabase
      .from('enrollments')
      .select('id, enrolled_at, user_id, courses(title)')
      .order('enrolled_at', { ascending: false })
      .limit(10),
  ])

  const totalRevenuePkr = (payments ?? []).reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0
  )

  return NextResponse.json({
    totalCourses: totalCourses ?? 0,
    totalEnrollments: totalEnrollments ?? 0,
    totalStudents: totalStudents ?? 0,
    totalRevenuePkr,
    pendingPayments: pendingPayments ?? 0,
    recentEnrollments: recentEnrollments ?? [],
  })
}
