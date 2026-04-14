import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
    .from('payment_settings')
    .select('*')
    .order('method')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const body = await request.json()

  const {
    method,
    account_name,
    account_number,
    iban,
    bank_name,
    is_active
  } = body

  const { error } = await supabase
    .from('payment_settings')
    .upsert(
      {
        method,
        account_name,
        account_number,
        iban,
        bank_name,
        is_active,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'method' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
