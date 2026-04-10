'use client'

import { useState } from 'react'
import { Course, Lesson } from '@/lib/types'

const BUNNY_URL = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net';
const LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID;

interface EnrollmentModalProps {
  course: Course
  user: any
  onClose: () => void
  onSuccess: () => void
  initialPreviewLesson?: Lesson | null // New prop to open a specific lesson
}

type Step = 'info' | 'payment' | 'preview'

export default function EnrollmentModal({ course, user, onClose, onSuccess, initialPreviewLesson }: EnrollmentModalProps) {
  const [step, setStep] = useState<Step>(initialPreviewLesson ? 'preview' : 'info')
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(initialPreviewLesson || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    phone: '',
    city: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // --- HELPER TO GET PUBLIC URL ---
  const getFullUrl = (path: string | null) => {
    if (!path) return "";
    if (path.includes('sg.storage.bunnycdn.com')) {
      return path.replace('https://sg.storage.bunnycdn.com/smartlearn', BUNNY_URL);
    }
    if (!path.startsWith('http')) {
      return `${BUNNY_URL}/${path}`;
    }
    return path;
  };

  const previewUrl = activeLesson?.bunny_video_id && LIBRARY_ID
    ? `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${activeLesson.bunny_video_id}?autoplay=true`
    : getFullUrl(activeLesson?.file_url || activeLesson?.video_url || "");

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
      if (data.success) onSuccess()
      else setError(data.error || 'Enrollment failed.')
    } catch (e) {
      setError('Something went wrong.')
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
      if (data.redirectUrl) window.location.href = data.redirectUrl
      else {
        setError(data.error || 'Payment gateway not available.');
        setLoading(false)
      }
    } catch (e) {
      setError('Payment failed.');
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
          customerEmail: form.email,
          customerName: form.fullName,
          customerPhone: form.phone,  // ✅ add this
        }),
      })
      const data = await res.json()
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
      else {
        setError(data.error || 'Payment gateway not available.');
        setLoading(false)
      }
    } catch (e) {
      setError('Payment failed.');
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 31, 61, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div className={`bg-white rounded-2xl w-full shadow-2xl overflow-hidden transition-all ${step === 'preview' ? 'max-w-4xl' : 'max-w-md'}`}>

        {/* Header */}
        <div className="bg-[#0F1F3D] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">
              {step === 'info' ? 'Your Information' : step === 'payment' ? 'Choose Payment' : 'Free Preview'}
            </h2>
            <p className="text-white/40 text-xs mt-0.5 truncate max-w-[260px]">
              {step === 'preview' ? activeLesson?.title : course.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Progress bar (hidden in preview) */}
        {step !== 'preview' && (
          <div className="h-0.5 bg-[#0F1F3D]/8">
            <div
              className="h-full bg-[#2563EB] transition-all duration-300"
              style={{ width: step === 'info' ? '50%' : '100%' }}
            />
          </div>
        )}

        <div className="p-0">
          {error && (
            <div className="m-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* ── Step: Preview Mode ── */}
          {step === 'preview' && (
            <div className="flex flex-col md:flex-row h-[70vh] md:h-[600px]">
              <div className="flex-[2] bg-black flex items-center justify-center">
                {activeLesson?.content_type === 'video' || activeLesson?.bunny_video_id ? (
                  <iframe src={previewUrl} className="w-full h-full border-0" allowFullScreen allow="autoplay" />
                ) : activeLesson?.content_type === 'pdf' ? (
                  <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full border-0" />
                ) : (
                  <div className="text-white/20 text-center">
                    <p className="text-4xl mb-2">📎</p>
                    <p className="text-sm">Preview not available for this type</p>
                  </div>
                )}
              </div>
              
              <div className="flex-1 bg-gray-50 border-l border-gray-100 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-[#0F1F3D] text-lg mb-2">Enjoying this lesson?</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    Enroll now to unlock the full course, assignments, and get your certificate.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setStep('info')}
                    className="w-full py-3.5 bg-[#2563EB] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
                  >
                    Enroll for Full Access
                  </button>
                  <button onClick={onClose} className="w-full py-3 text-sm text-gray-400 hover:text-gray-600">
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Info ── */}
          {step === 'info' && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#64748B]">
                {course.is_free ? 'Fill in your details for free access.' : 'Fill in your details to continue.'}
              </p>

              <div>
                <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">Full Name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2563EB]/10 outline-none ${errors.fullName ? 'border-red-400' : 'border-[#0F1F3D]/15'}`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2563EB]/10 outline-none ${errors.email ? 'border-red-400' : 'border-[#0F1F3D]/15'}`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="03XX XXXXXXX"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2563EB]/10 outline-none ${errors.phone ? 'border-red-400' : 'border-[#0F1F3D]/15'}`}
                />
              </div>

              <button
                onClick={course.is_free ? handleFreeCourseEnroll : handleNext}
                disabled={loading}
                className={`w-full py-4 text-white font-semibold rounded-xl transition-all mt-2 ${course.is_free ? 'bg-emerald-600' : 'bg-[#2563EB]'}`}
              >
                {loading ? 'Processing...' : course.is_free ? 'Enroll for Free →' : 'Continue to Payment →'}
              </button>
            </div>
          )}

          {/* ── Step 2: Payment ── */}
          {step === 'payment' && (
            <div className="p-6 space-y-4">
              <div className="bg-[#F8F9FF] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748B]">Total Amount</div>
                  <div className="text-2xl font-bold text-[#0F1F3D]">Rs. {course.price_pkr.toLocaleString()}</div>
                </div>
                <div className="text-right text-gray-400 text-sm font-semibold">${course.price_usd}</div>
              </div>

              <div className="space-y-3">
                <button onClick={handleSafepayPayment} disabled={loading} className="w-full p-4 border-2 rounded-xl border-gray-100 hover:border-[#2563EB] text-left transition-all">
                  <span className="block font-bold text-sm">Pay in PKR</span>
                  <span className="text-xs text-gray-500">Easypaisa, JazzCash, Card</span>
                </button>
                <button onClick={handlePaddlePayment} disabled={loading} className="w-full p-4 border-2 rounded-xl border-gray-100 hover:border-[#2563EB] text-left transition-all">
                  <span className="block font-bold text-sm">Pay Internationally</span>
                  <span className="text-xs text-gray-500">PayPal, Google Pay, Card</span>
                </button>
              </div>

              <button onClick={() => setStep('info')} className="w-full text-sm text-gray-400 py-2">← Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}