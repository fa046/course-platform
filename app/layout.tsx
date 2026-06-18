// app/layout.tsx
'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import Navbar from '@/components/Navbar'

declare global {
  interface Window {
    Paddle: any
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  useEffect(() => {
    // Load Paddle.js script
    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    script.async = true
    script.onload = () => {
      if (window.Paddle) {
        const env = process.env.NEXT_PUBLIC_PADDLE_ENV || 'sandbox'
        if (env === 'sandbox') {
          window.Paddle.Environment.set('sandbox')
        }
        window.Paddle.Initialize({
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
        })
      }
    }
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#F8F9FF] antialiased">
          {!isAdminPage && <Navbar />}
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}