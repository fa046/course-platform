'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  return (
    <main className="min-h-screen bg-[#F8F9FF] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-emerald-600 text-4xl">✓</span>
        </div>
        <h1 className="text-3xl font-bold text-[#0F1F3D] mb-4">Payment Successful!</h1>
        <p className="text-[#64748B] mb-8 leading-relaxed">
          You have successfully enrolled. Your learning journey starts now.
        </p>
        <div className="bg-white border border-[#0F1F3D]/8 rounded-2xl p-6 mb-8">
          <div className="space-y-3 text-left">
            {[
              'Your course is now unlocked',
              'A confirmation email has been sent',
              'Access your course anytime from the dashboard',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-sm text-[#0F1F3D]">
                <span className="text-emerald-500 flex-shrink-0">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-[#64748B] mb-4">
          Redirecting to dashboard in {countdown} seconds...
        </p>
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 bg-[#2563EB] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#1D4ED8] transition-all">
          Go to Dashboard →
        </Link>
      </div>
    </main>
  )
}