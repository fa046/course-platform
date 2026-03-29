import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId, customerEmail, customerName } = await request.json()

    // Get the Paddle price ID for this course
    // You will map course IDs to Paddle price IDs in your env or database
    const priceId = process.env[`PADDLE_PRICE_${courseId}`] || process.env.PADDLE_DEFAULT_PRICE_ID

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 400 })
    }

    // Create Paddle checkout session
    const paddleRes = await fetch('https://sandbox-api.paddle.com/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
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

    const paddleData = await paddleRes.json()

    if (!paddleRes.ok) {
      throw new Error(paddleData.error?.detail || 'Paddle error')
    }

    const checkoutUrl = paddleData.data?.checkout?.url

    return NextResponse.json({ checkoutUrl })
  } catch (error) {
    console.error('Paddle create error:', error)
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 })
  }
}