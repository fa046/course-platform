import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId || userId !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'uploads'
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })

    const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME
    const apiKey = process.env.BUNNY_STORAGE_API_KEY
    const cdnHostname = process.env.BUNNY_STORAGE_CDN_HOSTNAME // ✅ now = smartlearn.b-cdn.net
    const storageRegion = process.env.BUNNY_STORAGE_REGION || ''

    if (!storageZone || !apiKey || !cdnHostname) {
      return NextResponse.json({ error: 'Bunny Storage not configured yet' }, { status: 500 })
    }

    // Storage host is always the private sg endpoint for uploading
    const storageHost = storageRegion
      ? `${storageRegion}.storage.bunnycdn.com`
      : 'storage.bunnycdn.com'

    const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`
    const buffer = await file.arrayBuffer()

    // Upload to private storage endpoint
    const res = await fetch(`https://${storageHost}/${storageZone}/${filename}`, {
      method: 'PUT',
      headers: {
        AccessKey: apiKey,
        'Content-Type': file.type,
      },
      body: buffer,
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Bunny Storage upload error:', res.status, errText)
      throw new Error(`Bunny Storage upload failed: ${res.status} ${errText}`)
    }

    // ✅ Return public CDN (pull zone) URL, not the private storage URL
    // cdnHostname is now smartlearn.b-cdn.net so this will be:
    // https://smartlearn.b-cdn.net/thumbnails/123-img.jpg
    return NextResponse.json({
      url: `https://${cdnHostname}/${filename}`,
      path: filename, // ✅ also return clean relative path for convenience
    })
  } catch (err: any) {
    console.error('Image upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}