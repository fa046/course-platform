// app/layout.tsx
'use client' // Add this at the top to use usePathname

import { usePathname } from 'next/navigation'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import Navbar from '@/components/Navbar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Check if we are currently in the admin section
  const isAdminPage = pathname?.startsWith('/admin')

  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#F8F9FF] antialiased">
          {/* Only show the main Navbar if we ARE NOT in the admin panel */}
          {!isAdminPage && <Navbar />}
          
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}