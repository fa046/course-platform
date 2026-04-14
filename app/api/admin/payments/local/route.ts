import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

async function isAdmin(userId: string | null) {
  if (!userId) return false

  const supabase = createAdminClient()

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return data?.role === 'admin'
}

export async function GET() {
  const { userId } = await auth()

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('local_payments')
    .select('*, courses(title, slug), users(email)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const paymentsWithSignedUrls = await Promise.all(
    (data || []).map(async (payment) => {
      if (payment.proof_image_url) {
        try {
          const parts =
            payment.proof_image_url.split(
              '/object/public/payment-proofs/'
            )
          const filePath = parts[parts.length - 1]

          const { data: signedData, error: signedError } =
            await supabase.storage
              .from('payment-proofs')
              .createSignedUrl(filePath, 3600)

          if (!signedError && signedData) {
            return {
              ...payment,
              proof_image_url: signedData.signedUrl,
            }
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
