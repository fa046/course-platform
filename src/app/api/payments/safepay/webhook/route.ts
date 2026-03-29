import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Safepay sends payment status in webhook
    // Verify the payment is successful
    if (body.data?.status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()

    // Extract metadata we attached when creating the payment
    const { user_id, course_id } = body.data.metadata || {}

    if (!user_id || !course_id) {
      return NextResponse.json(
        { error: 'Missing metadata' },
        { status: 400 }
      )
    }

    // Record payment in database
    await supabase.from('payments').insert({
      user_id,
      course_id,
      amount: body.data.amount / 100, // Safepay sends amount in paisas
      currency: 'PKR',
      gateway: 'safepay',
      status: 'paid',
      gateway_payment_id: body.data.tracker,
    })

    // Create enrollment
    await supabase.from('enrollments').upsert({
      user_id,
      course_id,
    }, {
      onConflict: 'user_id,course_id',
      ignoreDuplicates: true,
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Safepay webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}