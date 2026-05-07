'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Course, CourseSection } from '@/lib/types'

// ─── Student Info Form (Step 1 — always shown first) ─────────────────────────
function StudentInfoForm({
  user,
  onNext,
  onClose,
  courseTitle,
  isFree,
}: {
  user: any
  onNext: (data: { name: string; email: string; phone: string; city: string }) => void
  onClose: () => void
  courseTitle: string
  isFree: boolean
}) {
  const [form, setForm] = useState({
    name: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    phone: '',
    city: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    else if (!/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (validate()) onNext(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1F3D]/75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-[#0F1F3D] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base">Your Information</h2>
            <p className="text-white/40 text-xs mt-0.5 truncate max-w-[240px]">{courseTitle}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">✕</button>
        </div>
        <div className="h-0.5 bg-[#0F1F3D]/8"><div className="h-full bg-[#2563EB] w-1/2" /></div>
        <div className="p-6">
          <p className="text-sm text-[#64748B] mb-5">
            {isFree ? 'Fill in your details to get free access instantly.' : 'Fill in your details first, then choose how to pay.'}
          </p>
          <div className="space-y-4">
            {[
              { label: 'Full Name *', key: 'name', type: 'text', ph: 'Your full name' },
              { label: 'Email *', key: 'email', type: 'email', ph: 'your@email.com' },
              { label: 'Phone Number *', key: 'phone', type: 'tel', ph: '03XX XXXXXXX' },
              { label: 'City', key: 'city', type: 'text', ph: 'Lahore, Karachi...' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.ph}
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-[#0F1F3D] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 ${
                    (errors as any)[f.key] ? 'border-red-400 bg-red-50' : 'border-[#0F1F3D]/15'
                  }`} />
                {(errors as any)[f.key] && <p className="text-xs text-red-500 mt-1">{(errors as any)[f.key]}</p>}
              </div>
            ))}
          </div>
          <button onClick={handleNext}
            className="w-full mt-5 py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#2563EB]/20">
            {isFree ? 'Enroll for Free →' : 'Continue to Payment →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Payment Picker (Step 2 — paid courses only) ──────────────────────────────
function PaymentPicker({
  course,
  studentData,
  onClose,
  onBack,
  onLocalSuccess,
}: {
  course: Course
  studentData: { name: string; email: string; phone: string; city: string }
  onClose: () => void
  onBack: () => void
  onLocalSuccess: () => void
}) {
  const [selected, setSelected] = useState<'local' | 'international' | null>(null)

  if (selected === 'local') {
    return (
      <LocalPaymentFlow
        course={course}
        studentData={studentData}
        onClose={onClose}
        onBack={() => setSelected(null)}
        onSuccess={onLocalSuccess}
      />
    )
  }
  if (selected === 'international') {
    return (
      <PaddleFlow
        course={course}
        studentData={studentData}
        onClose={onClose}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1F3D]/75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-[#0F1F3D] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base">Choose Payment</h2>
            <p className="text-white/40 text-xs mt-0.5 truncate max-w-[240px]">{course.title}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">✕</button>
        </div>
        <div className="h-0.5 bg-[#0F1F3D]/8"><div className="h-full bg-[#2563EB] w-full" /></div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-[#64748B] mb-1">Hi {studentData.name.split(' ')[0]} 👋 Choose how you'd like to pay:</p>
          <button onClick={() => setSelected('local')}
            className="w-full flex items-center gap-4 p-5 border-2 border-[#0F1F3D]/10 rounded-xl hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-all text-left group">
            <div className="w-12 h-12 bg-[#2563EB]/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🇵🇰</div>
            <div>
              <p className="font-semibold text-[#0F1F3D] group-hover:text-[#2563EB] transition-colors">Pay in PKR</p>
              <p className="text-xs text-[#64748B] mt-0.5">Click to explore options</p>
              <p className="text-sm font-bold text-[#0F1F3D] mt-1">Rs. {course.price_pkr.toLocaleString()}</p>
            </div>
          </button>
          <button onClick={() => setSelected('international')}
            className="w-full flex items-center gap-4 p-5 border-2 border-[#0F1F3D]/10 rounded-xl hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-all text-left group">
            <div className="w-12 h-12 bg-[#2563EB]/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">💳</div>
            <div>
              <p className="font-semibold text-[#0F1F3D] group-hover:text-[#2563EB] transition-colors">Pay by Card</p>
              <p className="text-xs text-[#64748B] mt-0.5">Visa · Mastercard · Apple Pay · Google Pay · PayPal</p>
              <p className="text-sm font-bold text-[#0F1F3D] mt-1">${course.price_usd} USD</p>
            </div>
          </button>
          <p className="text-xs text-center text-[#94A3B8] pt-1">🔒 Secure payment. 30-day money-back guarantee.</p>
          <button onClick={onBack} className="w-full text-sm text-[#64748B] hover:text-[#0F1F3D] transition-colors py-2 text-center">← Edit your information</button>
        </div>
      </div>
    </div>
  )
}

// ─── Paddle Flow ──────────────────────────────────────────────────────────────
function PaddleFlow({ course, studentData, onClose, onBack }: {
  course: Course
  studentData: { name: string; email: string; phone: string; city: string }
  onClose: () => void
  onBack: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/payments/paddle/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, customerEmail: studentData.email, customerName: studentData.name, customerPhone: studentData.phone }),
      })
      const data = await res.json()
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl }
      else { setError(data.error || 'Failed to start checkout. Please try again.'); setLoading(false) }
    } catch { setError('Something went wrong. Please try again.'); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1F3D]/75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-[#0F1F3D] px-6 py-5 flex items-center justify-between">
          <div><h2 className="text-white font-bold text-base">Card Payment</h2><p className="text-white/40 text-xs mt-0.5">{course.title}</p></div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">✕</button>
        </div>
        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
          <div className="p-4 bg-[#F8F9FF] rounded-xl mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#64748B]">Amount</span>
              <span className="text-xl font-bold text-[#0F1F3D]">${course.price_usd} USD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#64748B]">Paying as</span>
              <span className="text-xs text-[#0F1F3D] font-medium">{studentData.name} · {studentData.email}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-5 justify-center">
            {['💳 Visa/Mastercard', '🍎 Apple Pay', 'G Google Pay', '💰 PayPal'].map(m => (
              <span key={m} className="text-xs bg-[#F1F5F9] text-[#64748B] px-3 py-1.5 rounded-full">{m}</span>
            ))}
          </div>
          <button onClick={handleCheckout} disabled={loading}
            className="w-full py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#2563EB]/20">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Redirecting to checkout...</> : 'Pay Securely →'}
          </button>
          <p className="text-xs text-[#94A3B8] text-center mt-3">🔒 Secured by Paddle · PCI compliant</p>
          <button onClick={onBack} className="w-full text-sm text-[#64748B] hover:text-[#0F1F3D] transition-colors py-3 text-center">← Back to payment options</button>
        </div>
      </div>
    </div>
  )
}

// ─── Local Payment Flow ───────────────────────────────────────────────────────
type PaymentSetting = {
  method: string
  account_name: string | null
  account_number: string | null
  iban: string | null
  bank_name: string | null
  is_active: boolean
}

const METHOD_META: Record<string, { title: string; note: string; emoji: string }> = {
  jazzcash: { title: 'JazzCash', note: 'Send via JazzCash Mobile Account', emoji: '💜' },
  easypaisa: { title: 'Easypaisa', note: 'Send via Easypaisa Mobile Account or OTC', emoji: '💚' },
  bank_transfer: { title: 'Bank Transfer (International and Local)', note: 'Transfer via bank', emoji: '🏦' },
}

function LocalPaymentFlow({ course, studentData, onClose, onBack, onSuccess }: {
  course: Course
  studentData: { name: string; email: string; phone: string; city: string }
  onClose: () => void
  onBack: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<'method' | 'proof' | 'done'>('method')
  const [method, setMethod] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txId, setTxId] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([])
  const [settingsLoading, setSettingsLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/payment-settings')
      .then(r => r.json())
      .then(data => {
        setPaymentSettings(data.settings || [])
        setSettingsLoading(false)
      })
      .catch(() => setSettingsLoading(false))
  }, [])

  function getDisplayNumber(s: PaymentSetting) {
    if (s.method === 'bank_transfer') return s.iban || 'Contact admin for bank details'
    return s.account_number || 'Contact admin for account details'
  }

  function getNote(s: PaymentSetting) {
    if (s.method === 'bank_transfer') return s.bank_name ? `Transfer to ${s.bank_name}` : METHOD_META.bank_transfer.note
    return METHOD_META[s.method]?.note || ''
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setProofFile(f); setProofPreview(URL.createObjectURL(f))
  }

  async function handleSubmit() {
    if (!method) return
    if (!proofFile && !txId.trim()) { setError('Please upload a screenshot or enter your transaction ID'); return }
    setLoading(true); setError(null)
    try {
      let proofImageUrl: string | null = null
      if (proofFile) {
        setUploading(true)
        const fd = new FormData(); fd.append('file', proofFile)
        const r = await fetch('/api/payments/local/upload-proof', { method: 'POST', body: fd })
        const d = await r.json(); setUploading(false)
        if (d.url) proofImageUrl = d.url
      }
      const res = await fetch('/api/payments/local/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          paymentMethod: method,
          transactionId: txId || null,
          proofImageUrl,
          studentName: studentData.name,
          studentPhone: studentData.phone,
          studentCity: studentData.city,
        }),
      })
      const data = await res.json()
      if (data.success) setStep('done')
      else { setError(data.error || 'Submission failed. Please try again.'); setLoading(false) }
    } catch { setError('Something went wrong. Please try again.'); setLoading(false); setUploading(false) }
  }

  const selectedSetting = paymentSettings.find(s => s.method === method)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1F3D]/75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-[#0F1F3D] px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-white font-bold text-base">{step === 'done' ? 'Payment Submitted ✓' : 'Pay in PKR'}</h2>
            <p className="text-white/40 text-xs mt-0.5 truncate max-w-[240px]">{course.title}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">✕</button>
        </div>
        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          {/* Step: choose method */}
          {step === 'method' && (
            <div>
              <p className="text-sm text-[#64748B] mb-4">Choose payment method:</p>
              {settingsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-3 mb-5">
                  {paymentSettings.map(s => {
                    const meta = METHOD_META[s.method] || { title: s.method, note: '', emoji: '💳' }
                    return (
                      <button key={s.method} onClick={() => { setMethod(s.method); setStep('proof') }}
                        className="w-full flex items-center gap-4 p-4 border-2 border-[#0F1F3D]/10 rounded-xl hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-all text-left group">
                        <span className="text-2xl">{meta.emoji}</span>
                        <div>
                          <p className="font-semibold text-sm text-[#0F1F3D] group-hover:text-[#2563EB]">{meta.title}</p>
                          {s.account_name && <p className="text-xs text-[#64748B]">{s.account_name}</p>}
                          <p className="text-xs text-[#64748B]">{getNote(s)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 mb-3">
                ⏱ Access granted within 24 hours after verification
              </div>
              <button onClick={onBack} className="w-full text-sm text-[#64748B] hover:text-[#0F1F3D] transition-colors py-2 text-center">← Back to payment options</button>
            </div>
          )}

          {/* Step: show number + upload proof */}
          {step === 'proof' && method && selectedSetting && (
            <div>
              <div className="p-4 bg-[#F8F9FF] border border-[#0F1F3D]/8 rounded-xl mb-5">
                <p className="text-xs font-semibold text-[#0F1F3D]/50 uppercase tracking-wider mb-1">Send to</p>
                {selectedSetting.account_name && (
                  <p className="text-sm text-[#64748B] mb-1">{selectedSetting.account_name}</p>
                )}
                <p className="text-xl font-bold text-[#0F1F3D] font-mono mb-1">{getDisplayNumber(selectedSetting)}</p>
                <p className="text-sm font-bold text-[#2563EB] mb-1">Rs. {course.price_pkr.toLocaleString()}</p>
                <p className="text-xs text-[#64748B]">{getNote(selectedSetting)}</p>
              </div>
              <p className="text-sm font-semibold text-[#0F1F3D] mb-3">After sending, upload proof below:</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">Transaction ID</label>
                  <input type="text" value={txId} onChange={e => setTxId(e.target.value)} placeholder="e.g. TXN123456789"
                    className="w-full border border-[#0F1F3D]/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">Payment Screenshot *</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  {proofPreview ? (
                    <div className="relative">
                      <img src={proofPreview} alt="Proof" className="w-full h-40 object-cover rounded-xl border border-[#0F1F3D]/10" />
                      <button onClick={() => { setProofFile(null); setProofPreview(null) }}
                        className="absolute top-2 right-2 bg-white/90 w-7 h-7 rounded-full text-xs flex items-center justify-center shadow">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-[#0F1F3D]/15 rounded-xl py-6 text-sm text-[#64748B] hover:border-[#2563EB]/40 hover:bg-[#EFF6FF] transition-all flex flex-col items-center gap-2">
                      <span className="text-2xl">📸</span>
                      <span>Tap to upload screenshot</span>
                      <span className="text-xs text-[#94A3B8]">JPG, PNG · Max 5MB</span>
                    </button>
                  )}
                </div>
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="w-full mt-5 py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{uploading ? 'Uploading...' : 'Submitting...'}</> : 'Submit for Review →'}
              </button>
              <button onClick={() => setStep('method')} className="w-full text-sm text-[#64748B] py-3 text-center">← Change method</button>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
              <h3 className="text-lg font-bold text-[#0F1F3D] mb-2">Payment Submitted!</h3>
              <p className="text-sm text-[#64748B] mb-5 leading-relaxed">
                Our team will verify and activate your enrollment within <strong>24 hours</strong>.
              </p>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 text-left mb-5">
                <p className="font-semibold mb-1">What happens next?</p>
                <ul className="space-y-1">
                  <li>1. Admin verifies your payment screenshot</li>
                  <li>2. Your account is activated within 24 hours</li>
                  <li>3. You get an email once approved</li>
                </ul>
              </div>
              <button onClick={onClose} className="w-full py-3 bg-[#0F1F3D] text-white font-semibold rounded-xl hover:bg-[#1e3a6e] transition-colors">
                Got it
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Free Enroll handler ──────────────────────────────────────────────────────
async function enrollFree(courseId: string, studentData: { name: string; phone: string; city: string }) {
  const res = await fetch('/api/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, isFree: true, fullName: studentData.name, phone: studentData.phone, city: studentData.city }),
  })
  return res.json()
}

// ─── Syllabus Section Accordion ───────────────────────────────────────────────
function SyllabusSection({ section, index, enrolled, onLessonClick }: {
  section: CourseSection; index: number; enrolled: boolean
  onLessonClick: (id: string, isFree: boolean) => void
}) {
  const [open, setOpen] = useState(index === 0)
  const lessons = section.lessons || []
  const totalMins = Math.floor(lessons.reduce((a, l) => a + (l.duration_seconds || 0), 0) / 60)

  return (
    <div className="border border-[#0F1F3D]/8 rounded-xl overflow-hidden bg-white mb-2">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F8F9FF] transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#0F1F3D]/5 flex items-center justify-center text-xs font-bold text-[#0F1F3D]/40 flex-shrink-0">{index + 1}</div>
          <div>
            <p className="text-sm font-semibold text-[#0F1F3D]">{section.title}</p>
            {section.description && <p className="text-xs text-[#64748B] mt-0.5">{section.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className="text-xs text-[#64748B]">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}{totalMins > 0 ? ` · ${totalMins}m` : ''}</span>
          <svg className={`text-[#64748B] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </button>
      {open && (
        <div className="border-t border-[#0F1F3D]/6">
          {lessons.length === 0
            ? <p className="px-5 py-4 text-sm text-[#64748B]">Lessons coming soon</p>
            : lessons.map(lesson => {
              const canAccess = enrolled || lesson.is_free
              const type = lesson.content_type || 'video'
              const icon = !canAccess ? '🔒' : type === 'pdf' ? '📄' : type === 'file' ? '📎' : '▶'
              return (
                <button key={lesson.id} onClick={() => onLessonClick(lesson.id, lesson.is_free)}
                  className={`w-full flex items-center justify-between px-5 py-3 text-left border-b border-[#0F1F3D]/4 last:border-b-0 transition-all group ${canAccess ? 'hover:bg-[#EFF6FF]' : 'hover:bg-[#F8F9FF]/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${canAccess ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-[#0F1F3D]/5 text-[#0F1F3D]/25'}`}>{icon}</div>
                    <div>
                      <p className={`text-sm transition-colors ${canAccess ? 'text-[#0F1F3D] group-hover:text-[#2563EB]' : 'text-[#0F1F3D]/40'}`}>{lesson.title}</p>
                      {lesson.is_free && !enrolled && <span className="text-xs text-emerald-600 font-medium">Free preview</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {lesson.duration_seconds > 0 && <span className="text-xs text-[#64748B]">{Math.floor(lesson.duration_seconds / 60)}m</span>}
                    {canAccess && <svg className="text-[#2563EB]/30 group-hover:text-[#2563EB] transition-colors" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
                  </div>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}

// ─── Main Course Page ─────────────────────────────────────────────────────────
export default function CoursePage() {
  const { slug } = useParams()
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [courseComplete, setCourseComplete] = useState(false)
  const [enrollLoading, setEnrollLoading] = useState(false)

  type ModalState = 'none' | 'info_form' | 'payment_picker' | 'preview'
  const [modal, setModal] = useState<ModalState>('none')
  const [studentData, setStudentData] = useState<{ name: string; email: string; phone: string; city: string } | null>(null)
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null)

  useEffect(() => { if (slug) fetchCourse() }, [slug])
  useEffect(() => { if (user && course) checkEnrollment() }, [user, course])
  useEffect(() => { if (enrolled && course) checkProgress() }, [enrolled, course])

  async function fetchCourse() {
    try {
      const res = await fetch(`/api/courses/${slug}`)
      const data = await res.json()
      if (data.course) setCourse(data.course)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function checkEnrollment() {
    try {
      const res = await fetch(`/api/courses/${slug}/enrollment`)
      const data = await res.json()
      setEnrolled(data.enrolled)
    } catch (e) { console.error(e) }
  }

  async function checkProgress() {
    try {
      const res = await fetch(`/api/courses/${slug}/progress`)
      const data = await res.json()
      if (data.is_course_complete) setCourseComplete(true)
    } catch (e) { console.error(e) }
  }

  function handleEnrollClick() {
    if (!user) { router.push('/sign-in'); return }
    if (enrolled) { router.push(`/learn/${slug}`); return }
    setModal('info_form')
  }

  async function handleInfoSubmit(data: { name: string; email: string; phone: string; city: string }) {
    setStudentData(data)
    if (course?.is_free) {
      setEnrollLoading(true)
      try {
        const result = await enrollFree(course.id, data)
        if (result.success) {
          setEnrolled(true)
          setModal('none')
          router.push(`/learn/${slug}`)
        } else {
          setModal('none')
          alert(result.error || 'Enrollment failed. Please try again.')
        }
      } catch {
        setModal('none')
        alert('Something went wrong. Please try again.')
      } finally {
        setEnrollLoading(false)
      }
    } else {
      setModal('payment_picker')
    }
  }

  function handleLessonClick(lessonId: string, isFree: boolean) {
    if (enrolled) { router.push(`/learn/${slug}?lesson=${lessonId}`); return }
    if (isFree) { setPreviewLessonId(lessonId); setModal('preview'); return }
    if (!user) { router.push('/sign-in'); return }
    setModal('info_form')
  }

  if (loading || !isLoaded) {
    return (
      <main className="min-h-screen bg-[#F8F9FF] pt-24">
        <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
          <div className="h-8 bg-[#0F1F3D]/5 rounded w-1/2 mb-4" />
          <div className="h-4 bg-[#0F1F3D]/5 rounded w-full mb-2" />
          <div className="h-4 bg-[#0F1F3D]/5 rounded w-3/4" />
        </div>
      </main>
    )
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-[#F8F9FF] pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-[#0F1F3D] mb-2">Course not found</h2>
          <a href="/courses" className="text-[#2563EB] hover:underline">Browse all courses →</a>
        </div>
      </main>
    )
  }

  const BUNNY_PULL_ZONE = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net'

function getFullImageUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) {
    if (path.includes('.storage.bunnycdn.com')) {
      const match = path.match(/\.storage\.bunnycdn\.com\/[^/]+\/(.+)/)
      return match ? `${BUNNY_PULL_ZONE}/${match[1]}` : path
    }
    return path
  }
  return `${BUNNY_PULL_ZONE}/${path.replace(/^\//, '')}`
}
  const totalLessons = course.lessons?.length || 0
  const totalDuration = course.lessons?.reduce((a, l) => a + (l.duration_seconds || 0), 0) || 0
  const hours = Math.floor(totalDuration / 3600)
  const minutes = Math.floor((totalDuration % 3600) / 60)
  const freeLessonCount = course.lessons?.filter(l => l.is_free).length || 0
  const sections = course.sections || []
  const unsectionedLessons = (course as any).unsectioned_lessons || []

  const btnLabel = enrolled
    ? courseComplete ? '🎓 Course Completed' : '▶ Continue Learning'
    : course.is_free ? 'Enroll for Free' : 'Enroll Now'

  const btnStyle = enrolled
    ? courseComplete
      ? { background: '#059669', boxShadow: '0 8px 25px rgba(5,150,105,0.25)' }
      : { background: '#10B981', boxShadow: '0 8px 25px rgba(16,185,129,0.25)' }
    : { background: '#2563EB', boxShadow: '0 8px 25px rgba(37,99,235,0.25)' }

  const previewLesson = previewLessonId ? course.lessons?.find(l => l.id === previewLessonId) : null
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID
  const BUNNY_URL = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE || 'https://smartlearn.b-cdn.net'
  const getPreviewFileUrl = (path: string | null) => {
    if (!path) return null
    if (path.includes('sg.storage.bunnycdn.com')) return path.replace('https://sg.storage.bunnycdn.com/smartlearn', BUNNY_URL)
    if (!path.startsWith('http')) return `${BUNNY_URL}/${path}`
    return path
  }
  const previewContentType = previewLesson?.content_type || 'video'
  const previewEmbedUrl = previewLesson?.bunny_video_id && libraryId
    ? `https://iframe.mediadelivery.net/embed/${libraryId}/${previewLesson.bunny_video_id}?autoplay=true`
    : previewLesson?.video_url || null
  const previewFileUrl = getPreviewFileUrl(previewLesson?.file_url || null)

  return (
    <main className="min-h-screen bg-[#F8F9FF]">
      <div className="bg-[#0F1F3D] pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_380px] gap-12 items-start">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {course.is_free && <span className="inline-flex items-center bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30">Free Course</span>}
              {courseComplete && <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-500/30">🎓 Completed</span>}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{course.title}</h1>
            <p className="text-white/60 text-lg leading-relaxed mb-6 max-w-2xl">{course.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
              <span>📚 {totalLessons} lessons</span>
              {hours > 0 ? <span>⏱ {hours}h {minutes}m total</span> : minutes > 0 ? <span>⏱ {minutes}m total</span> : null}
              <span>♾ Lifetime access</span>
              <span>📜 Certificate included</span>
              {freeLessonCount > 0 && !enrolled && <span className="text-emerald-400">✦ {freeLessonCount} free preview{freeLessonCount > 1 ? 's' : ''}</span>}
            </div>
            {sections.length > 0 && (
              <div className="mt-8 p-5 rounded-xl border border-white/10 bg-white/5">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">What you'll learn</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {sections.map(s => (
                    <div key={s.id} className="flex items-start gap-2">
                      <span className="text-[#2563EB] flex-shrink-0 mt-0.5">✓</span>
                      <span className="text-white/70 text-sm">{s.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {course.related_blog_url && (
              <div className="mt-5">
                <a href={course.related_blog_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#93C5FD] hover:text-white transition-colors">
                  <span>📖</span><span>Read more about this topic on our blog →</span>
                </a>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-2xl shadow-black/20 sticky top-24">
            <div className="aspect-video bg-gradient-to-br from-[#2563EB]/10 to-[#93C5FD]/20 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
             {getFullImageUrl(course.thumbnail_url) ? <img src={getFullImageUrl(course.thumbnail_url)!} alt={course.title} className="w-full h-full object-cover rounded-xl" /> : <span className="text-[#2563EB] text-4xl">▶</span>}
            </div>
            {course.is_free
              ? <div className="mb-4"><span className="text-3xl font-bold text-emerald-600">Free</span></div>
              : <div className="mb-4">
                  <div className="text-3xl font-bold text-[#0F1F3D]">Rs. {course.price_pkr.toLocaleString()}</div>
                  <div className="text-sm text-[#64748B] mt-1">${course.price_usd} USD for international students</div>
                </div>}
            <button onClick={handleEnrollClick} disabled={enrollLoading}
              className="w-full py-4 rounded-xl font-semibold text-base text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-lg mb-3 disabled:opacity-70"
              style={btnStyle}>
              {enrollLoading ? 'Enrolling...' : btnLabel}
            </button>
            {enrolled && courseComplete && (
              <button onClick={() => router.push(`/learn/${slug}`)}
                className="w-full py-3 rounded-xl font-medium text-sm text-[#2563EB] border border-[#2563EB]/20 hover:bg-[#2563EB]/5 transition-all mb-3">
                Review Course →
              </button>
            )}
            {!enrolled && !course.is_free && <p className="text-xs text-[#64748B] text-center mb-4">30-day money-back guarantee</p>}
            <div className="mt-4 pt-4 border-t border-[#0F1F3D]/8 space-y-2.5">
              {['✓ Lifetime access', '✓ Certificate of completion', '✓ Urdu & English content', `✓ ${totalLessons} lessons`].map(item => (
                <div key={item} className="text-sm text-[#64748B]">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0F1F3D]">Course Curriculum</h2>
            {!enrolled && freeLessonCount > 0 && <span className="text-sm text-[#64748B]">{freeLessonCount} free preview{freeLessonCount !== 1 ? 's' : ''}</span>}
          </div>
          {sections.length > 0 ? (
            <div className="mb-12">
              {sections.map((s, i) => <SyllabusSection key={s.id} section={s} index={i} enrolled={enrolled} onLessonClick={handleLessonClick} />)}
              {unsectionedLessons.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-[#64748B] uppercase tracking-wider mb-2 px-1">Additional Lessons</p>
                  {unsectionedLessons.map((lesson: any) => {
                    const canAccess = enrolled || lesson.is_free
                    return (
                      <button key={lesson.id} onClick={() => handleLessonClick(lesson.id, lesson.is_free)}
                        className="w-full flex items-center justify-between p-4 bg-white border border-[#0F1F3D]/8 rounded-xl mb-2 hover:border-[#2563EB]/30 transition-all text-left group">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${canAccess ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-[#0F1F3D]/5 text-[#0F1F3D]/25'}`}>{!canAccess ? '🔒' : '▶'}</div>
                          <span className={`text-sm font-medium ${canAccess ? 'text-[#0F1F3D] group-hover:text-[#2563EB]' : 'text-[#0F1F3D]/40'}`}>{lesson.title}</span>
                        </div>
                        <span className="text-xs text-[#64748B]">{lesson.duration_seconds > 0 ? `${Math.floor(lesson.duration_seconds / 60)}m` : '—'}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 mb-12">
              {course.lessons && course.lessons.length > 0
                ? course.lessons.map((lesson, i) => {
                    const canAccess = enrolled || lesson.is_free
                    return (
                      <button key={lesson.id} onClick={() => handleLessonClick(lesson.id, lesson.is_free)}
                        className="w-full flex items-center justify-between p-4 bg-white border border-[#0F1F3D]/8 rounded-xl hover:border-[#2563EB]/30 transition-all text-left group">
                        <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${canAccess ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-[#0F1F3D]/5 text-[#0F1F3D]/25'}`}>{!canAccess ? '🔒' : '▶'}</div>
                          <div>
                            <p className={`text-sm font-medium ${canAccess ? 'text-[#0F1F3D] group-hover:text-[#2563EB]' : 'text-[#0F1F3D]/50'}`}>{i + 1}. {lesson.title}</p>
                            {lesson.is_free && !enrolled && <span className="text-xs text-emerald-600 font-medium">Free preview</span>}
                          </div>
                        </div>
                        <span className="text-xs text-[#64748B]">{lesson.duration_seconds > 0 ? `${Math.floor(lesson.duration_seconds / 60)}m` : '—'}</span>
                      </button>
                    )
                  })
                : <div className="text-center py-10 text-[#64748B] bg-white rounded-2xl border border-[#0F1F3D]/8">Curriculum coming soon</div>}
            </div>
          )}
        </div>
      </div>

      {modal === 'preview' && previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setModal('none')}>
          <div className="bg-[#0A1628] rounded-2xl overflow-hidden w-full max-w-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div><p className="text-white font-semibold text-sm">Free Preview</p><p className="text-white/40 text-xs mt-0.5">{previewLesson.title}</p></div>
              <div className="flex items-center gap-3">
                {!course.is_free && (
                  <button onClick={() => { setModal('none'); setTimeout(() => setModal('info_form'), 100) }}
                    className="text-xs bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors font-medium">Enroll for Full Access</button>
                )}
                <button onClick={() => setModal('none')} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">✕</button>
              </div>
            </div>
            <div className="aspect-video bg-black">
              {previewContentType === 'video'
                ? previewEmbedUrl
                  ? <iframe src={previewEmbedUrl} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
                  : <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">Video coming soon</div>
                : previewContentType === 'pdf' && previewFileUrl
                  ? <div className="w-full h-full flex flex-col bg-[#060D1F]">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 flex-shrink-0">
                        <span className="text-xs text-white/40">PDF Preview</span>
                        <div className="flex gap-2">
                          <a href={previewFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-white/40 hover:text-white bg-white/10 px-3 py-1 rounded-lg">Open ↗</a>
                          <a href={previewFileUrl} download className="text-xs text-white/40 hover:text-white bg-white/10 px-3 py-1 rounded-lg">↓ Download</a>
                        </div>
                      </div>
                      <iframe src={`${previewFileUrl}#toolbar=1&navpanes=0`} className="w-full flex-1 border-0" />
                    </div>
                  : previewFileUrl
                    ? <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#060D1F]">
                        <div className="text-5xl">📎</div>
                        <p className="text-white/50 text-sm">{previewLesson?.title}</p>
                        <a href={previewFileUrl} download target="_blank" rel="noopener noreferrer"
                          className="bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-500 transition-colors">↓ Download File</a>
                      </div>
                    : <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">Content coming soon</div>}
            </div>
            <div className="px-5 py-4"><p className="text-white/70 text-sm">{previewLesson.title}</p></div>
          </div>
        </div>
      )}

      {modal === 'info_form' && course && user && (
        <StudentInfoForm user={user} courseTitle={course.title} isFree={course.is_free}
          onClose={() => setModal('none')} onNext={handleInfoSubmit} />
      )}

      {modal === 'payment_picker' && course && user && studentData && (
        <PaymentPicker course={course} studentData={studentData}
          onClose={() => { setModal('none'); setStudentData(null) }}
          onBack={() => setModal('info_form')}
          onLocalSuccess={() => setModal('none')} />
      )}
    </main>
  )
}
