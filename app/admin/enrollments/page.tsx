'use client'

import { useEffect, useState } from 'react'

type Enrollment = {
  id: string
  enrolled_at: string
  full_name: string | null
  phone: string | null
  city: string | null
  user_id: string
  courses: { title: string; slug: string }
  users: { email: string }
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/enrollments')
      .then(r => r.json())
      .then(data => { setEnrollments(data.enrollments ?? []); setLoading(false) })
  }, [])

  const filtered = enrollments.filter(e =>
    e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.users?.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.courses?.title?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1F3D]">Enrollments</h1>
          <p className="text-gray-500 mt-1">{enrollments.length} total enrollments</p>
        </div>
        <a href="/api/admin/enrollments/export" download
          className="border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          ↓ Export CSV
        </a>
      </div>

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or course..."
          className="w-full max-w-sm border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Student</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Course</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">City</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No enrollments found.</td></tr>
            )}
            {filtered.map(e => (
              <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-[#0F1F3D]">{e.full_name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{e.users?.email}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-[#0F1F3D]">{e.courses?.title}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{e.phone ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{e.city ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{new Date(e.enrolled_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}