import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId } = await auth()
  
  // Security Check
  if (!userId || userId !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'files'
    
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME
    const apiKey = process.env.BUNNY_STORAGE_API_KEY
    const storageRegion = process.env.BUNNY_STORAGE_REGION || '' // e.g. 'sg', 'uk', etc.

    if (!storageZone || !apiKey) {
      return NextResponse.json({ error: 'Bunny Storage not configured yet' }, { status: 500 })
    }

    /**
     * Build the correct storage hostname based on region
     * Default (no region prefix) = Germany (de)
     * sg = Singapore, uk = UK, ny = New York, la = Los Angeles, se = Stockholm
     */
    const storageHost = storageRegion
      ? `${storageRegion}.storage.bunnycdn.com`
      : 'storage.bunnycdn.com'

    // Create a clean relative path for the filename
    const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`
    const buffer = await file.arrayBuffer()

    // Upload to Bunny Storage (Internal Endpoint)
    const res = await fetch(`https://${storageHost}/${storageZone}/${filename}`, {
      method: 'PUT',
      headers: {
        AccessKey: apiKey,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buffer,
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Bunny Storage upload error:', res.status, errText)
      throw new Error(`Bunny Storage upload failed: ${res.status} ${errText}`)
    }

    /**
     * SUCCESS: Return ONLY the relative path (e.g., "lessons/123-file.pdf")
     * We do NOT return the full https://sg.storage... URL anymore.
     */
    return NextResponse.json({ url: filename })

  } catch (err: any) {
    console.error('File upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}