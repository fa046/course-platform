'use client'

import { useEffect, useState } from 'react'

type LocalPayment = {
  id: string
  created_at: string
  amount: number
  payment_method: string
  transaction_id: string | null
  proof_image_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  student_name: string | null
  student_phone: string | null
  student_city: string | null
  courses: { title: string; slug: string }
  users: { email: string }
}

export default function LocalPaymentsPage() {
  const [payments, setPayments] = useState<LocalPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selected, setSelected] = useState<LocalPayment | null>(null)
  const [processing, setProcessing] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const fetchPayments = () => {
    setLoading(true)
    fetch('/api/admin/payments/local')
      .then(r => r.json())
      .then(data => { setPayments(data.payments ?? []); setLoading(false) })
  }

  useEffect(() => { fetchPayments() }, [])

  const filtered = payments.filter(p => filter === 'all' ? true : p.status === filter)

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this payment and enroll the student?')) return
    setProcessing(true)
    await fetch(`/api/admin/payments/local/${id}/approve`, { method: 'POST' })
    await fetchPayments()
    setSelected(null)
    setProcessing(false)
  }

  const handleReject = async (id: string) => {
    if (!rejectNote.trim()) return alert('Please enter a rejection reason')
    setProcessing(true)
    await fetch(`/api/admin/payments/local/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_note: rejectNote }),
    })
    await fetchPayments()
    setSelected(null)
    setShowRejectInput(false)
    setRejectNote('')
    setProcessing(false)
  }

  const statusColor = (s: string) => ({
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }[s] ?? 'bg-gray-100 text-gray-600')

  const methodLabel = (m: string) => ({
    jazzcash: 'JazzCash', easypaisa: 'Easypaisa', bank_transfer: 'Bank Transfer (International and Local)'
  }[m] ?? m)

  const pendingCount = payments.filter(p => p.status === 'pending').length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#0F1F3D]">Local Payments</h1>
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount} pending</span>
          )}
        </div>
        <p className="text-gray-500 mt-1">JazzCash, Easypaisa and Bank Transfer submissions</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-[#2563EB] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {f} {f !== 'all' && `(${payments.filter(p => p.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Student</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Course</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Method</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No payments found.</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-[#0F1F3D]">{p.student_name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{p.users?.email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-[#0F1F3D]">{p.courses?.title}</td>
                <td className="px-6 py-4 text-sm font-medium text-[#0F1F3D]">₨ {p.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{methodLabel(p.payment_method)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { setSelected(p); setShowRejectInput(false); setRejectNote('') }}
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                    Review →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-[#0F1F3D]">Payment Review</h2>
              <button onClick={() => { setSelected(null); setShowRejectInput(false) }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Student</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">Name</span><p className="font-medium text-[#0F1F3D]">{selected.student_name ?? '—'}</p></div>
                  <div><span className="text-gray-400">Phone</span><p className="font-medium text-[#0F1F3D]">{selected.student_phone ?? '—'}</p></div>
                  <div><span className="text-gray-400">City</span><p className="font-medium text-[#0F1F3D]">{selected.student_city ?? '—'}</p></div>
                  <div><span className="text-gray-400">Email</span><p className="font-medium text-[#0F1F3D] text-xs">{selected.users?.email}</p></div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">Course</span><p className="font-medium text-[#0F1F3D]">{selected.courses?.title}</p></div>
                  <div><span className="text-gray-400">Amount</span><p className="font-medium text-[#0F1F3D]">₨ {selected.amount.toLocaleString()}</p></div>
                  <div><span className="text-gray-400">Method</span><p className="font-medium text-[#0F1F3D]">{methodLabel(selected.payment_method)}</p></div>
                  <div><span className="text-gray-400">Transaction ID</span><p className="font-medium text-[#0F1F3D] font-mono text-xs">{selected.transaction_id ?? '—'}</p></div>
                </div>
              </div>

              {/* Proof Image */}
              {selected.proof_image_url && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Proof</h3>
                  <a href={selected.proof_image_url} target="_blank">
                    <img src={selected.proof_image_url} alt="Payment proof"
                      className="w-full rounded-xl border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in" />
                  </a>
                  <p className="text-xs text-gray-400 mt-1 text-center">Click to open full size</p>
                </div>
              )}

              {/* Admin note if rejected */}
              {selected.admin_note && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-600">Rejection reason:</p>
                  <p className="text-sm text-red-700 mt-1">{selected.admin_note}</p>
                </div>
              )}

              {/* Reject input */}
              {showRejectInput && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rejection Reason *</label>
                  <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                    rows={3} placeholder="Tell the student why their payment was rejected..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none" />
                </div>
              )}
            </div>

            {/* Actions */}
            {selected.status === 'pending' && (
              <div className="p-6 border-t border-gray-100 space-y-3">
                {!showRejectInput ? (
                  <div className="flex gap-3">
                    <button onClick={() => setShowRejectInput(true)}
                      className="flex-1 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                      ✕ Reject
                    </button>
                    <button onClick={() => handleApprove(selected.id)} disabled={processing}
                      className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60">
                      {processing ? 'Processing...' : '✓ Approve & Enroll'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setShowRejectInput(false)}
                      className="flex-1 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handleReject(selected.id)} disabled={processing}
                      className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60">
                      {processing ? 'Rejecting...' : 'Confirm Reject'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}