'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useAuth } from '@clerk/nextjs'

export default function Navbar() {
  const pathname = usePathname()
  const { isSignedIn } = useAuth()

  // Hide navbar on learn page — it has its own top bar
  if (pathname?.startsWith('/learn/')) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#0F1F3D]/8 bg-[#F8F9FF]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#0F1F3D]">SmartSkillify</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/courses"
            className={`text-sm transition-colors ${
              pathname === '/courses'
                ? 'text-[#2563EB] font-medium'
                : 'text-[#0F1F3D]/60 hover:text-[#0F1F3D]'
            }`}>
            Courses
          </Link>
          <Link href="/blog"
            className={`text-sm transition-colors ${
              pathname === '/blog'
                ? 'text-[#2563EB] font-medium'
                : 'text-[#0F1F3D]/60 hover:text-[#0F1F3D]'
            }`}>
            Blog
          </Link>
          <Link href="/about"
            className={`text-sm transition-colors ${
              pathname === '/about'
                ? 'text-[#2563EB] font-medium'
                : 'text-[#0F1F3D]/60 hover:text-[#0F1F3D]'
            }`}>
            About
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <>
              <Link href="/sign-in"
                className="text-sm text-[#0F1F3D]/70 hover:text-[#0F1F3D] transition-colors px-4 py-2">
                Sign in
              </Link>
              <Link href="/sign-up"
                className="text-sm bg-[#2563EB] text-white font-medium px-4 py-2 rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm shadow-[#2563EB]/20">
                Get started
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard"
                className={`text-sm transition-colors mr-2 ${
                  pathname === '/dashboard'
                    ? 'text-[#2563EB] font-medium'
                    : 'text-[#0F1F3D]/60 hover:text-[#0F1F3D]'
                }`}>
                Dashboard
              </Link>
              <UserButton />
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
