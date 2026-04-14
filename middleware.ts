import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const isPublicRoute = createRouteMatcher([
  '/',
  '/courses(.*)',
  '/blog(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/courses(.*)',
  '/api/payments(.*)',
  '/api/webhooks(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)'])

// ✅ Yeh 2 IDs hamesha admin rahein ge — Supabase ke baghair bhi
const PERMANENT_ADMIN_IDS = [
  'user_3CLJ3ksOwGhiyO7h4TTU3xC37U5', // Tumhara Clerk ID
  'user_3CFgkvitpp5rJTjnqseUAmln7Tg', // Owner ka Clerk ID
]

export default clerkMiddleware(async (auth, request) => {
  if (isAdminRoute(request)) {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    // Hardcoded admins — hamesha access
    if (PERMANENT_ADMIN_IDS.includes(userId)) {
      return
    }

    // Baaki users Supabase se check honge
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
