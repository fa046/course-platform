'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Stats = {
  totalCourses: number
  totalEnrollments: number
  totalStudents: number
  totalRevenuePkr: number
  recentEnrollments: {
    id: string
    enrolled_at: string
    user_id: string
    courses: { title: string }
  }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F1F3D]">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back. Here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Courses" value={stats?.totalCourses ?? 0} icon="📚" />
        <StatCard label="Total Enrollments" value={stats?.totalEnrollments ?? 0} icon="🎓" />
        <StatCard label="Total Students" value={stats?.totalStudents ?? 0} icon="👥" />
        <StatCard label="Revenue (PKR)" value={`₨ ${(stats?.totalRevenuePkr ?? 0).toLocaleString()}`} icon="💰" />
      </div>

      <div className="flex gap-4 mb-10">
        <Link href="/admin/courses/new"
          className="bg-[#2563EB] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors">
          + New Course
        </Link>
        <Link href="/admin/courses"
          className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Manage Courses
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0F1F3D]">Recent Enrollments</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {stats?.recentEnrollments?.length === 0 && (
            <p className="px-6 py-8 text-gray-400 text-sm text-center">No enrollments yet.</p>
          )}
          {stats?.recentEnrollments?.map(e => (
            <div key={e.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0F1F3D]">{e.courses?.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{e.user_id}</p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(e.enrolled_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="text-2xl mb-3">{icon}</div>
      <p className="text-2xl font-bold text-[#0F1F3D]">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}