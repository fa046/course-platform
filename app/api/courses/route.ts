import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const free = searchParams.get('free')
    const search = searchParams.get('search')

    const { userId } = await auth()
    const adminClient = createAdminClient()
    let isAdmin = false

    if (userId) {
      const { data: user, error: userError } = await adminClient
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (userError) throw userError
      isAdmin = user?.role === 'admin'
    }

    const supabase = isAdmin
      ? adminClient
      : createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

    let query = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('is_published', true)
    }

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
    console.error('Courses API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
