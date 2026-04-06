import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId || userId !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('enrollments')
    .select('*, courses(title), users(email)')
    .order('enrolled_at', { ascending: false })
  const rows = (data ?? []).map((e: any) => [
    e.full_name ?? '', e.users?.email ?? '', e.phone ?? '',
    e.city ?? '', e.courses?.title ?? '',
    new Date(e.enrolled_at).toLocaleDateString(),
  ])
  const csv = [
    ['Name', 'Email', 'Phone', 'City', 'Course', 'Enrolled At'].join(','),
    ...rows.map((r: string[]) => r.map((v: string) => `"${v}"`).join(',')),
  ].join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="enrollments.csv"',
    },
  })
}
