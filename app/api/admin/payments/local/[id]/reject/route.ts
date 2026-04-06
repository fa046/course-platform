import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId || userId !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { admin_note } = await request.json()
  if (!admin_note?.trim()) return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 })
  const supabase = createAdminClient()
  const { error } = await supabase.from('local_payments').update({
    status: 'rejected', admin_note,
    reviewed_at: new Date().toISOString(), reviewed_by: userId,
  }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
