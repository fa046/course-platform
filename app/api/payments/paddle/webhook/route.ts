import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendEnrollmentConfirmation } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('paddle-signature')
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Verify Paddle signature
    if (signature) {
      const parts = Object.fromEntries(
        signature.split(';').map(p => p.split('='))
      )
      const ts = parts['ts']
      const h1 = parts['h1']

      if (ts && h1) {
        const signed = `${ts}:${rawBody}`
        const expected = crypto
          .createHmac('sha256', webhookSecret)
          .update(signed)
          .digest('hex')

        if (expected !== h1) {
          console.error('Paddle webhook signature mismatch')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      }
    }

    const event = JSON.parse(rawBody)
    const supabase = createAdminClient()

    // ── transaction.completed → enroll student ──────────────────────────────
    if (event.event_type === 'transaction.completed') {
      const transaction = event.data
      const customData = transaction.custom_data

      const userId = customData?.user_id
      const courseId = customData?.course_id

      if (!userId || !courseId) {
        console.error('Missing user_id or course_id in Paddle custom_data')
        return NextResponse.json({ error: 'Missing custom data' }, { status: 400 })
      }

      // Update payment record to completed
      await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('gateway_payment_id', transaction.id)
        .eq('gateway', 'paddle')

      // Enroll the student
      const { error: enrollError } = await supabase
        .from('enrollments')
        .upsert(
          { user_id: userId, course_id: courseId },
          { onConflict: 'user_id,course_id', ignoreDuplicates: true }
        )

      if (enrollError) {
        console.error('Failed to enroll after Paddle payment:', enrollError)
        return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 })
      }

      console.log(`✅ Enrolled user ${userId} in course ${courseId} via Paddle`)

      // ── Send enrollment confirmation email ────────────────────────────────
      try {
        // Fetch user email + course details for the email
        const [{ data: user }, { data: course }] = await Promise.all([
          supabase.from('users').select('email, full_name').eq('id', userId).single(),
          supabase.from('courses').select('title, slug').eq('id', courseId).single(),
        ])

        if (user?.email && course) {
          await sendEnrollmentConfirmation({
            to: user.email,
            studentName: user.full_name || 'there',
            courseTitle: course.title,
            courseSlug: course.slug,
          })
        }
      } catch (emailError) {
        // Don't fail the webhook if email fails — Paddle will retry otherwise
        console.error('Paddle enrollment email failed:', emailError)
      }
    }

    // ── transaction.payment_failed ──────────────────────────────────────────
    if (event.event_type === 'transaction.payment_failed') {
      const transaction = event.data
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('gateway_payment_id', transaction.id)
        .eq('gateway', 'paddle')
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Paddle webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}