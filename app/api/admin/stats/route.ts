import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId || userId !== process.env.ADMIN_USER_ID) {
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
    supabase.from('local_payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('local_payments').select('amount').eq('status', 'approved'),
    supabase.from('enrollments').select('id, enrolled_at, user_id, courses(title)').order('enrolled_at', { ascending: false }).limit(10),
  ])

  const totalRevenuePkr = (payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)

  return NextResponse.json({
    totalCourses: totalCourses ?? 0,
    totalEnrollments: totalEnrollments ?? 0,
    totalStudents: totalStudents ?? 0,
    totalRevenuePkr,
    pendingPayments: pendingPayments ?? 0,
    recentEnrollments: recentEnrollments ?? [],
  })
}
