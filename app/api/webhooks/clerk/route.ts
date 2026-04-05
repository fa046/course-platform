import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // Get svix headers for verification
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await request.text()

  // Verify the webhook
  let event: any
  try {
    const wh = new Webhook(WEBHOOK_SECRET)
    event = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { type, data } = event

  // ── user.created ────────────────────────────────────────────────────────────
  if (type === 'user.created') {
    const email = data.email_addresses?.[0]?.email_address ?? ''
    const firstName = data.first_name ?? ''
    const lastName = data.last_name ?? ''
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || null
    const avatarUrl = data.image_url ?? null

    const { error } = await supabase.from('users').upsert({
      id: data.id,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: 'student',
    }, { onConflict: 'id' })

    if (error) {
      console.error('Failed to create user in Supabase:', error)
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
    }
  }

  // ── user.updated ────────────────────────────────────────────────────────────
  if (type === 'user.updated') {
    const email = data.email_addresses?.[0]?.email_address ?? ''
    const firstName = data.first_name ?? ''
    const lastName = data.last_name ?? ''
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || null
    const avatarUrl = data.image_url ?? null

    const { error } = await supabase.from('users').upsert({
      id: data.id,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
    }, { onConflict: 'id' })

    if (error) console.error('Failed to update user in Supabase:', error)
  }

  // ── user.deleted ────────────────────────────────────────────────────────────
  if (type === 'user.deleted') {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', data.id)

    if (error) console.error('Failed to delete user from Supabase:', error)
  }

  return NextResponse.json({ success: true })
}