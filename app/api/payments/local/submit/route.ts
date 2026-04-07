import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendLocalPaymentReceived } from '@/lib/email'

// POST /api/payments/local/submit
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      courseId,
      paymentMethod,
      transactionId,
      proofImageUrl,
      studentName,
      studentPhone,
      studentCity,
    } = body

    if (!courseId || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['jazzcash', 'easypaisa', 'bank_transfer'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, price_pkr, is_published, title')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (!course.is_published) {
      return NextResponse.json({ error: 'Course not available' }, { status: 400 })
    }

    // Ensure user in Supabase + capture email
    let userEmail = ''
    const clerkUser = await currentUser()
    if (clerkUser) {
      userEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? ''
      await supabase.from('users').upsert({
        id: userId,
        email: userEmail,
        full_name: studentName || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
        avatar_url: clerkUser.imageUrl ?? null,
        role: 'student',
      }, { onConflict: 'id' })
    }

    // Check if already submitted or enrolled
    const { data: existingPayment } = await supabase
      .from('local_payments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (existingPayment) {
      if (existingPayment.status === 'approved') {
        return NextResponse.json({ error: 'You are already enrolled in this course' }, { status: 400 })
      }
      if (existingPayment.status === 'pending') {
        return NextResponse.json({ error: 'Your payment is already under review' }, { status: 400 })
      }
      // If rejected, allow resubmission
      const { error: updateError } = await supabase
        .from('local_payments')
        .update({
          payment_method: paymentMethod,
          transaction_id: transactionId || null,
          proof_image_url: proofImageUrl || null,
          student_name: studentName || null,
          student_phone: studentPhone || null,
          student_city: studentCity || null,
          status: 'pending',
          admin_note: null,
          reviewed_at: null,
        })
        .eq('id', existingPayment.id)

      if (updateError) throw updateError

      // Send email for resubmission too
      if (userEmail) {
        try {
          await sendLocalPaymentReceived({
            to: userEmail,
            studentName: studentName || 'there',
            courseTitle: course.title,
            paymentMethod,
            amount: course.price_pkr,
          })
        } catch (emailError) {
          console.error('Resubmission email failed:', emailError)
        }
      }

      return NextResponse.json({ success: true, message: 'Payment resubmitted for review' })
    }

    // Insert new local payment record
    const { error: insertError } = await supabase
      .from('local_payments')
      .insert({
        user_id: userId,
        course_id: courseId,
        amount: course.price_pkr,
        payment_method: paymentMethod,
        transaction_id: transactionId || null,
        proof_image_url: proofImageUrl || null,
        student_name: studentName || null,
        student_phone: studentPhone || null,
        student_city: studentCity || null,
        status: 'pending',
      })

    if (insertError) {
      console.error('Local payment insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit payment' }, { status: 500 })
    }

    // ── Send payment received email ──────────────────────────────────────────
    if (userEmail) {
      try {
        await sendLocalPaymentReceived({
          to: userEmail,
          studentName: studentName || 'there',
          courseTitle: course.title,
          paymentMethod,
          amount: course.price_pkr,
        })
      } catch (emailError) {
        console.error('Local payment email failed:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment submitted for review. You will be enrolled within 24 hours after verification.',
    })

  } catch (error) {
    console.error('Local payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}