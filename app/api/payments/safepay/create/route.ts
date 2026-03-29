import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId, amount, customerName, customerEmail, customerPhone } = await request.json()

    // Safepay API call to create payment
    const safepayRes = await fetch('https://sandbox.api.getsafepay.com/order/v1/init/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SAFEPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        currency: 'PKR',
        amount: amount * 100, // Convert to paisas
        order_id: `order_${userId}_${courseId}_${Date.now()}`,
        source: 'custom',
        is_test: process.env.NODE_ENV !== 'production',
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses`,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?course=${courseId}`,
        metadata: {
          user_id: userId,
          course_id: courseId,
        },
        customer: {
          name: customerName,
          email: customerEmail,
          phone_number: customerPhone,
        },
      }),
    })

    const safepayData = await safepayRes.json()

    if (!safepayRes.ok) {
      throw new Error(safepayData.message || 'Safepay error')
    }

    const tracker = safepayData.data?.tracker
    const redirectUrl = `https://sandbox.api.getsafepay.com/checkout/pay?tracker=${tracker}&environment=sandbox&source=custom`

    return NextResponse.json({ redirectUrl })
  } catch (error) {
    console.error('Safepay create error:', error)
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 })
  }
}