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
        try {
          // Extract just the filename from the full URL
          const parts = payment.proof_image_url.split('/payment-proofs/')
          const filePath = parts[parts.length - 1]

          const { data: signedData, error: signedError } = await supabase.storage
            .from('payment-proofs')
            .createSignedUrl(`payment-proofs/${filePath}`, 3600)

          if (!signedError && signedData) {
            return { ...payment, proof_image_url: signedData.signedUrl }
          }
        } catch (e) {
          console.error('Signed URL error:', e)
        }
      }
      return payment
    })
  )

  return NextResponse.json({ payments: paymentsWithSignedUrls })
}