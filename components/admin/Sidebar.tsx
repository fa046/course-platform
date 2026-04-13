'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '◉', exact: true },
  { href: '/admin/courses', label: 'Courses', icon: '📚', exact: false },
  { href: '/admin/enrollments', label: 'Enrollments', icon: '🎓', exact: false },
  { href: '/admin/payments/local', label: 'Local Payments', icon: '💳', exact: false },
  { href: '/admin/payments/settings', label: 'Payment Settings', icon: '⚙️', exact: false },
  { href: '/admin/blog', label: 'Blog', icon: '✍️', exact: false },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0F1F3D] flex flex-col z-40">
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <span className="text-white font-semibold text-sm">SmartSkillify</span>
            <p className="text-white/40 text-xs">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[#2563EB] text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <UserButton />
          <div>
            <p className="text-white text-xs font-medium">Admin</p>
            <Link href="/" className="text-white/40 text-xs hover:text-white/70 transition-colors">
              View site →
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
