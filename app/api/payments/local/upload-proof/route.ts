import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/payments/local/upload-proof
// Uploads payment proof image to Supabase Storage
// Returns the public URL
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG and WebP images are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be under 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `payment-proofs/${userId}-${Date.now()}.${ext}`

    const buffer = await file.arrayBuffer()
    const supabase = createAdminClient()

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const { data } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(filename)

    return NextResponse.json({ url: data.publicUrl })
  } catch (error) {
    console.error('Upload proof error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}