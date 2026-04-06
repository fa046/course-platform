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
    const folder = (formData.get('folder') as string) || 'files'
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME
    const apiKey = process.env.BUNNY_STORAGE_API_KEY
    const cdnHostname = process.env.BUNNY_STORAGE_CDN_HOSTNAME
    if (!storageZone || !apiKey || !cdnHostname) {
      return NextResponse.json({ error: 'Bunny Storage not configured yet' }, { status: 500 })
    }
    const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`
    const buffer = await file.arrayBuffer()
    const res = await fetch(`https://storage.bunnycdn.com/${storageZone}/${filename}`, {
      method: 'PUT',
      headers: { AccessKey: apiKey, 'Content-Type': file.type },
      body: buffer,
    })
    if (!res.ok) throw new Error('Upload failed')
    return NextResponse.json({ url: `https://${cdnHostname}/${filename}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
