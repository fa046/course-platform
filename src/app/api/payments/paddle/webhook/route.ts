import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Only process completed transactions
    if (body.event_type !== 'transaction.completed') {
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()

    // Extract metadata we attached when creating the checkout
    const customData = body.data?.custom_data || {}
    const { user_id, course_id } = customData

    if (!user_id || !course_id) {
      return NextResponse.json(
        { error: 'Missing custom data' },
        { status: 400 }
      )
    }

    const amount = body.data?.details?.totals?.total
    const currency = body.data?.currency_code || 'USD'

    // Record payment
    await supabase.from('payments').insert({
      user_id,
      course_id,
      amount: parseFloat(amount) / 100,
      currency,
      gateway: 'paddle',
      status: 'paid',
      gateway_payment_id: body.data?.id,
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
    console.error('Paddle webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}