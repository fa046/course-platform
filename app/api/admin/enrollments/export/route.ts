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

  const { data } = await supabase
    .from('enrollments')
    .select('*, courses(title), users(email)')
    .order('enrolled_at', { ascending: false })

  const rows = (data ?? []).map((e: any) => [
    e.full_name ?? '',
    e.users?.email ?? '',
    e.phone ?? '',
    e.city ?? '',
    e.courses?.title ?? '',
    new Date(e.enrolled_at).toLocaleDateString(),
  ])

  const csv = [
    ['Name', 'Email', 'Phone', 'City', 'Course', 'Enrolled At'].join(','),
    ...rows.map((r: string[]) =>
      r.map((v: string) => `"${v}"`).join(',')
    ),
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="enrollments.csv"',
    },
  })
}
