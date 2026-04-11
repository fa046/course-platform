import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId, customerEmail, customerName, customerPhone } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price_usd, paddle_price_id, is_published')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    if (!course.is_published) {
      return NextResponse.json({ error: 'Course not available' }, { status: 400 })
    }
    if (!course.paddle_price_id) {
      return NextResponse.json({ error: 'Online card payment is not yet configured for this course. Please use a local payment method.' }, { status: 400 })
    }

    // Ensure user exists in Supabase
    const clerkUser = await currentUser()
    if (clerkUser) {
      await supabase.from('users').upsert({
        id: userId,
        email: clerkUser.emailAddresses?.[0]?.emailAddress ?? customerEmail,
        full_name: customerName || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
        avatar_url: clerkUser.imageUrl ?? null,
        role: 'student',
      }, { onConflict: 'id' })
    }

    const apiKey = process.env.PADDLE_API_KEY
    const env = process.env.NEXT_PUBLIC_PADDLE_ENV || 'sandbox'
    const baseUrl = env === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com'
    const checkoutBase = env === 'production' ? 'https://buy.paddle.com' : 'https://sandbox-buy.paddle.com'

    const paddleRes = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ price_id: course.paddle_price_id, quantity: 1 }],
        customer: { email: customerEmail, name: customerName },
        custom_data: { user_id: userId, course_id: courseId, customer_phone: customerPhone || '' },
      }),
    })

    if (!paddleRes.ok) {
      const err = await paddleRes.json()
      console.error('Paddle API error:', JSON.stringify(err, null, 2))
      return NextResponse.json({ error: err?.error?.detail || err?.error?.code || 'Failed to create payment session' }, { status: 500 })
    }

    const paddleData = await paddleRes.json()
    const transactionId = paddleData.data?.id

    if (!transactionId) {
      return NextResponse.json({ error: 'No transaction ID from Paddle' }, { status: 500 })
    }

    // Build the hosted checkout URL from transaction ID
    const checkoutUrl = `${checkoutBase}/checkout/custom/${transactionId}`

    // Save pending payment record
    await supabase.from('payments').insert({
      user_id: userId,
      course_id: courseId,
      amount: course.price_usd,
      currency: 'USD',
      gateway: 'paddle',
      status: 'pending',
      gateway_payment_id: transactionId,
      metadata: { transaction_id: transactionId, customer_name: customerName, customer_phone: customerPhone },
    })

    return NextResponse.json({ 
      checkoutUrl,
      transactionId,
    })
  } catch (error) {
    console.error('Paddle create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}