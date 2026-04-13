'use client'

import { useEffect, useState } from 'react'

type PaymentSetting = {
  id: string
  method: string
  account_name: string | null
  account_number: string | null
  iban: string | null
  bank_name: string | null
  is_active: boolean
}

const METHOD_LABELS: Record<string, { title: string; emoji: string }> = {
  jazzcash: { title: 'JazzCash', emoji: '💜' },
  easypaisa: { title: 'Easypaisa', emoji: '💚' },
  bank_transfer: { title: 'Bank Transfer', emoji: '🏦' },
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, PaymentSetting>>({})

  useEffect(() => {
    fetch('/api/admin/payment-settings')
      .then(r => r.json())
      .then(data => {
        const s = data.settings || []
        setSettings(s)
        const f: Record<string, PaymentSetting> = {}
        s.forEach((item: PaymentSetting) => { f[item.method] = { ...item } })
        setForm(f)
        setLoading(false)
      })
  }, [])

  async function handleSave(method: string) {
    setSaving(method)
    const item = form[method]
    const res = await fetch('/api/admin/payment-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    setSaving(null)
    if (res.ok) {
      setSaved(method)
      setTimeout(() => setSaved(null), 2000)
    }
  }

  function update(method: string, field: string, value: any) {
    setForm(prev => ({ ...prev, [method]: { ...prev[method], [field]: value } }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F1F3D]">Payment Settings</h1>
        <p className="text-gray-500 mt-1">Manage local payment method details shown to students.</p>
      </div>

      <div className="space-y-6">
        {Object.entries(METHOD_LABELS).map(([method, { title, emoji }]) => {
          const item = form[method]
          if (!item) return null
          const isBank = method === 'bank_transfer'

          return (
            <div key={method} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <h2 className="font-semibold text-[#0F1F3D]">{title}</h2>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-500">Active</span>
                  <div
                    onClick={() => update(method, 'is_active', !item.is_active)}
                    className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${item.is_active ? 'bg-[#2563EB]' : 'bg-gray-200'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${item.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </label>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">Account Name</label>
                  <input
                    type="text"
                    value={item.account_name || ''}
                    onChange={e => update(method, 'account_name', e.target.value)}
                    placeholder="e.g. SmartSkillify"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2563EB]"
                  />
                </div>

                {!isBank && (
                  <div>
                    <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">
                      {method === 'jazzcash' ? 'JazzCash Number' : 'Easypaisa Number'}
                    </label>
                    <input
                      type="text"
                      value={item.account_number || ''}
                      onChange={e => update(method, 'account_number', e.target.value)}
                      placeholder="03XX XXXXXXX"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2563EB]"
                    />
                  </div>
                )}

                {isBank && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">Bank Name</label>
                      <input
                        type="text"
                        value={item.bank_name || ''}
                        onChange={e => update(method, 'bank_name', e.target.value)}
                        placeholder="e.g. HBL / Meezan Bank"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-[#0F1F3D] uppercase tracking-wider mb-1.5 block">IBAN</label>
                      <input
                        type="text"
                        value={item.iban || ''}
                        onChange={e => update(method, 'iban', e.target.value)}
                        placeholder="PK00XXXX0000000000000000"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={() => handleSave(method)}
                  disabled={saving === method}
                  className="px-6 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-60"
                >
                  {saving === method ? 'Saving...' : saved === method ? '✓ Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
