import { Suspense } from 'react'
import PaymentSuccessContent from './PaymentSuccessContent'

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#F8F9FF] flex items-center justify-center">
        <div className="text-[#64748B]">Loading...</div>
      </main>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}