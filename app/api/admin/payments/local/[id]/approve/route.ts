import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { userId } = await auth()
  if (!userId || userId !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const supabase = createAdminClient()
  const { data: payment, error: fetchError } = await supabase
    .from('local_payments')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchError || !payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }
  if (payment.status !== 'pending') {
    return NextResponse.json({ error: 'Already processed' }, { status: 400 })
  }
  await supabase.from('local_payments').update({
    status: 'approved',
    reviewed_at: new Date().toISOString(),
    reviewed_by: userId,
  }).eq('id', id)
  const { error: enrollError } = await supabase.from('enrollments').upsert({
    user_id: payment.user_id,
    course_id: payment.course_id,
    enrolled_at: new Date().toISOString(),
    full_name: payment.student_name,
    phone: payment.student_phone,
    city: payment.student_city,
  }, { onConflict: 'user_id,course_id' })
  if (enrollError) {
    return NextResponse.json({ error: enrollError.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}