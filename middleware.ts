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

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()

  // 🔐 Admin routes protection
  if (isAdminRoute(request)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Check role in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !user || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
  }

  // 🔐 Protect all non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
