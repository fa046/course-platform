'use client'

import { useState } from 'react'
import { Course } from '@/lib/types'

interface EnrollmentModalProps {
  course: Course
  user: any
  onClose: () => void
  onSuccess: () => void
}

type Step = 'info' | 'payment'

export default function EnrollmentModal({ course, user, onClose, onSuccess }: EnrollmentModalProps) {
  const [step, setStep] = useState<Step>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    phone: '',
    city: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    else if (!/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (validate()) setStep('payment')
  }

  async function handleFreeCourseEnroll() {
    if (!validate()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          isFree: true,
          fullName: form.fullName,
          phone: form.phone,
          city: form.city,
        }),
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || 'Enrollment failed. Please try again.')
      }
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSafepayPayment() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/safepay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          amount: course.price_pkr,
          customerName: form.fullName,
          customerEmail: form.email,
          customerPhone: form.phone,
        }),
      })
      const data = await res.json()
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        setError('Payment gateway not available yet. Please try again later.')
        setLoading(false)
      }
    } catch (e) {
      setError('Payment failed. Please try again.')
      setLoading(false)
    }
  }

  async function handlePaddlePayment() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/paddle/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          priceId: course.id,
          customerEmail: form.email,
          customerName: form.fullName,
        }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setError('Payment gateway not available yet. Please try again later.')
        setLoading(false)
      }
    } catch (e) {
      setError('Payment failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 31, 61, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-[#0F1F3D] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">
              {step === 'info' ? 'Your Information' : 'Choose Payment'}
            </h2>
            <p className="text-white/40 text-xs mt-0.5 truncate max-w-[260px]">{course.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-[#0F1F3D]/8">
          <div
            className="h-full bg-[#2563EB] transition-all duration-300"
            style={{ width: step === 'info' ? '50%' : '100%' }}
          />
        </div>

        <div className="p-6">

          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* ── Step 1: Info ── */}
          {step === 'info' && (
            <div className="space-y-4">
              <p className="text-sm text-[#64748B] mb-2">
                {course.is_free
                  ? 'Fill in your details to get free access.'
                  : 'Fill in your details to continue to payment.'}
              </p>

              {/* Full Name */}
              <div>
                <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Your full name"
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-[#0F1F3D] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 ${
                    errors.fullName ? 'border-red-400 bg-red-50' : 'border-[#0F1F3D]/15'
                  }`}
                />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-[#0F1F3D] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 ${
                    errors.email ? 'border-red-400 bg-red-50' : 'border-[#0F1F3D]/15'
                  }`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="03XX XXXXXXX"
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-[#0F1F3D] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 ${
                    errors.phone ? 'border-red-400 bg-red-50' : 'border-[#0F1F3D]/15'
                  }`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">
                  City <span className="text-[#64748B] font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="Lahore, Karachi, etc."
                  className="w-full border border-[#0F1F3D]/15 rounded-xl px-4 py-3 text-sm text-[#0F1F3D] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                />
              </div>

              {course.is_free ? (
                <button
                  onClick={handleFreeCourseEnroll}
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    'Enroll for Free →'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl transition-all mt-2 shadow-lg shadow-[#2563EB]/20"
                >
                  Continue to Payment →
                </button>
              )}
            </div>
          )}

          {/* ── Step 2: Payment ── */}
          {step === 'payment' && (
            <div>
              <div className="bg-[#F8F9FF] rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748B] mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-[#0F1F3D]">
                    Rs. {course.price_pkr.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#64748B] mb-1">International</div>
                  <div className="text-lg font-semibold text-[#64748B]">${course.price_usd}</div>
                </div>
              </div>

              <p className="text-sm font-semibold text-[#0F1F3D] mb-4">Select payment method:</p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={handleSafepayPayment}
                  disabled={loading}
                  className="w-full p-4 border-2 border-[#0F1F3D]/10 rounded-xl hover:border-[#2563EB] hover:bg-[#2563EB]/3 transition-all text-left group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2563EB]/10 rounded-xl flex items-center justify-center text-lg">🇵🇰</div>
                      <div>
                        <div className="font-semibold text-sm text-[#0F1F3D] group-hover:text-[#2563EB] transition-colors">
                          Pay in PKR
                        </div>
                        <div className="text-xs text-[#64748B]">JazzCash, Easypaisa, Bank Card</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#0F1F3D]">Rs. {course.price_pkr.toLocaleString()}</div>
                      <div className="text-xs text-[#64748B]">via Safepay</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handlePaddlePayment}
                  disabled={loading}
                  className="w-full p-4 border-2 border-[#0F1F3D]/10 rounded-xl hover:border-[#2563EB] hover:bg-[#2563EB]/3 transition-all text-left group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2563EB]/10 rounded-xl flex items-center justify-center text-lg">🌍</div>
                      <div>
                        <div className="font-semibold text-sm text-[#0F1F3D] group-hover:text-[#2563EB] transition-colors">
                          Pay Internationally
                        </div>
                        <div className="text-xs text-[#64748B]">Card, PayPal, Apple Pay, Google Pay</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#0F1F3D]">${course.price_usd}</div>
                      <div className="text-xs text-[#64748B]">via Paddle</div>
                    </div>
                  </div>
                </button>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-[#64748B] mb-4">
                  <div className="w-4 h-4 border-2 border-[#64748B]/30 border-t-[#64748B] rounded-full animate-spin" />
                  Redirecting to payment...
                </div>
              )}

              <button
                onClick={() => setStep('info')}
                className="w-full text-sm text-[#64748B] hover:text-[#0F1F3D] transition-colors py-2"
              >
                ← Back
              </button>

              <p className="text-xs text-[#64748B] text-center mt-3">
                🔒 Secure payment. 30-day money-back guarantee.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}