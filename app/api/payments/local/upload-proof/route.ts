import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// POST /api/payments/local/upload-proof
// Uploads payment proof image to Bunny Storage
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

    const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME
    const storageApiKey = process.env.BUNNY_STORAGE_API_KEY
    const cdnHostname = process.env.BUNNY_STORAGE_CDN_HOSTNAME

    if (!storageZone || !storageApiKey || !cdnHostname) {
      return NextResponse.json(
        { error: 'File storage not configured' },
        { status: 500 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `payment-proofs/${userId}-${Date.now()}.${ext}`

    const buffer = await file.arrayBuffer()

    // Upload to Bunny Storage
    const uploadRes = await fetch(
      `https://storage.bunnycdn.com/${storageZone}/${filename}`,
      {
        method: 'PUT',
        headers: {
          AccessKey: storageApiKey,
          'Content-Type': file.type,
        },
        body: buffer,
      }
    )

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      console.error('Bunny Storage upload error:', err)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const publicUrl = `https://${cdnHostname}/${filename}`

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Upload proof error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}