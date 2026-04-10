import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId || userId !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('local_payments')
    .select('*, courses(title, slug), users(email)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Generate signed URLs for proof images
  const paymentsWithSignedUrls = await Promise.all(
    (data || []).map(async (payment) => {
      if (payment.proof_image_url) {
        // Extract the file path from the URL
        const url = new URL(payment.proof_image_url)
        const filePath = url.pathname.split('/payment-proofs/')[1]

        if (filePath) {
          const { data: signedData, error: signedError } = await supabase.storage
            .from('payment-proofs')
            .createSignedUrl(`payment-proofs/${filePath}`, 3600) // 1 hour expiry

          if (!signedError && signedData) {
            return { ...payment, proof_image_url: signedData.signedUrl }
          }
        }
      }
      return payment
    })
  )

  return NextResponse.json({ payments: paymentsWithSignedUrls })
}