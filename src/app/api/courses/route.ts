import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const free = searchParams.get('free')
    const search = searchParams.get('search')

    const supabase = await createClient()

    let query = supabase
      .from('courses')
      .select('*, lessons(count)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (free === 'true') {
      query = query.eq('is_free', true)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ courses: data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}