import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// POST /api/lessons/upload-url
// Creates a video in Bunny Stream and returns the upload URL + video GUID
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title } = await request.json()
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID
    const apiKey = process.env.BUNNY_STREAM_API_KEY

    if (!libraryId || !apiKey) {
      return NextResponse.json({ error: 'Bunny.net not configured' }, { status: 500 })
    }

    // Step 1: Create video object in Bunny Stream
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      }
    )

    if (!createRes.ok) {
      const err = await createRes.text()
      console.error('Bunny create video error:', err)
      return NextResponse.json({ error: 'Failed to create video in Bunny' }, { status: 500 })
    }

    const video = await createRes.json()

    // Return the video GUID and the upload endpoint
    return NextResponse.json({
      videoId: video.guid,
      uploadUrl: `https://video.bunnycdn.com/library/${libraryId}/videos/${video.guid}`,
      apiKey, // needed client-side to PUT the file directly to Bunny
    })
  } catch (error) {
    console.error('Upload URL error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}