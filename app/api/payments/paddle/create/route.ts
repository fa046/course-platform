import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId, customerEmail, customerName } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get course with paddle_price_id
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
      return NextResponse.json(
        { error: 'Payment not configured for this course yet' },
        { status: 400 }
      )
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
    const baseUrl = env === 'production'
      ? 'https://api.paddle.com'
      : 'https://sandbox-api.paddle.com'

    // Create Paddle transaction
    const paddleRes = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            price_id: course.paddle_price_id,
            quantity: 1,
          },
        ],
        customer: {
          email: customerEmail,
          name: customerName,
        },
        custom_data: {
          user_id: userId,
          course_id: courseId,
        },
        checkout: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?course=${courseId}`,
        },
      }),
    })

    if (!paddleRes.ok) {
      const err = await paddleRes.json()
      console.error('Paddle API error:', err)
      return NextResponse.json(
        { error: 'Failed to create payment session' },
        { status: 500 }
      )
    }

    const paddleData = await paddleRes.json()
    const checkoutUrl = paddleData.data?.checkout?.url

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'No checkout URL returned from Paddle' },
        { status: 500 }
      )
    }

    // Save pending payment record
    await supabase.from('payments').insert({
      user_id: userId,
      course_id: courseId,
      amount: course.price_usd,
      currency: 'USD',
      gateway: 'paddle',
      status: 'pending',
      gateway_payment_id: paddleData.data?.id,
      metadata: { transaction_id: paddleData.data?.id },
    })

    return NextResponse.json({ checkoutUrl })
  } catch (error) {
    console.error('Paddle create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}