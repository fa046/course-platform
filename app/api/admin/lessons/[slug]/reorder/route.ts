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

export async function PATCH(request: Request) {
  const { userId } = await auth()

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lessons } = await request.json()

  if (!Array.isArray(lessons)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const supabase = createAdminClient()

  await Promise.all(
    lessons.map(
      ({ id, position }: { id: string; position: number }) =>
        supabase
          .from('lessons')
          .update({ position })
          .eq('id', id)
    )
  )

  return NextResponse.json({ success: true })
}
