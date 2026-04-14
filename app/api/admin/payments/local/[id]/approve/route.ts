import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { sendEnrollmentConfirmation } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

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

export async function POST(_req: Request, { params }: Params) {
  const { userId } = await auth()

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data: payment, error: fetchError } = await supabase
    .from('local_payments')
    .select('*, courses(title, slug), users(email)')
    .eq('id', id)
    .single()

  if (fetchError || !payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  if (payment.status !== 'pending') {
    return NextResponse.json({ error: 'Already processed' }, { status: 400 })
  }

  await supabase
    .from('local_payments')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq('id', id)

  const { error: enrollError } = await supabase
    .from('enrollments')
    .upsert(
      {
        user_id: payment.user_id,
        course_id: payment.course_id,
        enrolled_at: new Date().toISOString(),
        full_name: payment.student_name,
        phone: payment.student_phone,
        city: payment.student_city,
      },
      { onConflict: 'user_id,course_id' }
    )

  if (enrollError) {
    return NextResponse.json({ error: enrollError.message }, { status: 500 })
  }

  // 📧 Send email (non-critical)
  try {
    const userEmail = payment.users?.email
    const courseTitle = payment.courses?.title
    const courseSlug = payment.courses?.slug

    if (userEmail && courseTitle && courseSlug) {
      await sendEnrollmentConfirmation({
        to: userEmail,
        studentName: payment.student_name || 'there',
        courseTitle,
        courseSlug,
      })
    }
  } catch (emailError) {
    console.error('Enrollment email failed:', emailError)
  }

  return NextResponse.json({ success: true })
}
