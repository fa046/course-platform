export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()

  if (isAdminRoute(request)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    if (PERMANENT_ADMIN_IDS.includes(userId)) {
      return NextResponse.next()
    }

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
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  return NextResponse.next()
})
