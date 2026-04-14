import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function POST(request: Request) {
  const { userId } = await auth()

  // 🔐 Supabase role-based security
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files allowed' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be under 5MB' },
        { status: 400 }
      )
    }

    const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME
    const apiKey = process.env.BUNNY_STORAGE_API_KEY
    const cdnHostname = process.env.BUNNY_STORAGE_CDN_HOSTNAME
    const storageRegion = process.env.BUNNY_STORAGE_REGION || ''

    if (!storageZone || !apiKey || !cdnHostname) {
      return NextResponse.json(
        { error: 'Bunny Storage not configured yet' },
        { status: 500 }
      )
    }

    const storageHost = storageRegion
      ? `${storageRegion}.storage.bunnycdn.com`
      : 'storage.bunnycdn.com'

    const filename = `${folder}/${Date.now()}-${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      '-'
    )}`

    const buffer = await file.arrayBuffer()

    const res = await fetch(
      `https://${storageHost}/${storageZone}/${filename}`,
      {
        method: 'PUT',
        headers: {
          AccessKey: apiKey,
          'Content-Type': file.type,
        },
        body: buffer,
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error(
        'Bunny Storage upload error:',
        res.status,
        errText
      )
      throw new Error(
        `Bunny Storage upload failed: ${res.status} ${errText}`
      )
    }

    return NextResponse.json({
      url: `https://${cdnHostname}/${filename}`,
      path: filename,
    })
  } catch (err: any) {
    console.error('Image upload error:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
