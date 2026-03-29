import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'LearnSmart — Learn Skills That Matter',
  description: 'Expert-led online courses in design, development, business and marketing. Learn in Urdu and English.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#F8F9FF] antialiased">
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}