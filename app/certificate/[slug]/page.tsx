'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

type CertData = {
  studentName: string
  courseTitle: string
  completedAt: string
  courseSlug: string
}

export default function CertificatePage() {
  const { slug } = useParams()
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [certData, setCertData] = useState<CertData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const certRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoaded && !user) { router.push('/sign-in'); return }
    if (user && slug) fetchCertData()
  }, [user, isLoaded, slug])

  async function fetchCertData() {
    try {
      // Check enrollment
      const enrollRes = await fetch(`/api/courses/${slug}/enrollment`)
      const enrollData = await enrollRes.json()
      if (!enrollData.enrolled) {
        setError('You are not enrolled in this course.')
        setLoading(false)
        return
      }

      // Check completion
      const progressRes = await fetch(`/api/courses/${slug}/progress`)
      const progressData = await progressRes.json()
      if (!progressData.is_course_complete) {
        setError('Complete all lessons to earn your certificate.')
        setLoading(false)
        return
      }

      // Get course info
      const courseRes = await fetch(`/api/courses/${slug}`)
      const courseData = await courseRes.json()

      setCertData({
        studentName: user?.fullName || user?.firstName || 'Student',
        courseTitle: courseData.course?.title || '',
        completedAt: new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }),
        courseSlug: slug as string,
      })
    } catch (e) {
      setError('Failed to load certificate.')
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-[#F8F9FF] pt-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
          <p className="text-[#64748B] text-sm">Loading your certificate...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F8F9FF] pt-24 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">🎓</div>
          <h2 className="text-xl font-bold text-[#0F1F3D] mb-2">Certificate Not Available</h2>
          <p className="text-[#64748B] mb-6">{error}</p>
          <a href={`/learn/${slug}`}
            className="inline-block bg-[#2563EB] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1D4ED8] transition-colors">
            Continue Learning →
          </a>
        </div>
      </main>
    )
  }

  if (!certData) return null

  return (
    <main className="min-h-screen bg-[#F0F4FF] pt-24 pb-16">
      {/* Actions bar — hidden on print */}
      <div className="max-w-4xl mx-auto px-6 mb-8 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold text-[#0F1F3D]">Your Certificate</h1>
          <p className="text-sm text-[#64748B]">Congratulations on completing the course!</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/dashboard"
            className="text-sm text-[#64748B] hover:text-[#0F1F3D] transition-colors border border-[#0F1F3D]/15 px-4 py-2 rounded-xl">
            ← Dashboard
          </a>
          <button onClick={handlePrint}
            className="bg-[#2563EB] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center gap-2">
            🖨 Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Certificate */}
      <div
        ref={certRef}
        className="max-w-4xl mx-auto px-6"
        id="certificate"
      >
        <div
          className="bg-white rounded-3xl shadow-2xl shadow-black/10 overflow-hidden relative"
          style={{ minHeight: '560px' }}
        >
          {/* Top accent bar */}
          <div className="h-2 bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#3B82F6]" />

          {/* Corner decorations */}
          <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-[#2563EB]/20 rounded-tl-xl" />
          <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-[#2563EB]/20 rounded-tr-xl" />
          <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-[#2563EB]/20 rounded-bl-xl" />
          <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-[#2563EB]/20 rounded-br-xl" />

          <div className="flex flex-col items-center justify-center text-center px-16 py-16">

            {/* Logo / brand */}
            <div className="w-14 h-14 bg-[#0F1F3D] rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-[#0F1F3D]/20">
              <span className="text-white font-black text-xl">S</span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#64748B] mb-3">
              SmartSkillify
            </p>

            <h2 className="text-3xl font-bold text-[#0F1F3D] mb-2"
              style={{ fontFamily: 'Georgia, serif' }}>
              Certificate of Completion
            </h2>

            <p className="text-[#64748B] text-sm mb-10">
              This is to certify that
            </p>

            {/* Student name */}
            <p className="text-4xl font-bold text-[#2563EB] mb-6 border-b-2 border-[#2563EB]/20 pb-4 px-8"
              style={{ fontFamily: 'Georgia, serif' }}>
              {certData.studentName}
            </p>

            <p className="text-[#64748B] text-sm mb-4">
              has successfully completed
            </p>

            {/* Course name */}
            <h3 className="text-xl font-bold text-[#0F1F3D] mb-8 max-w-lg leading-snug">
              {certData.courseTitle}
            </h3>

            {/* Stars / award */}
            <div className="flex items-center gap-2 mb-10 text-amber-400 text-2xl">
              ★ ★ ★
            </div>

            {/* Date + signature row */}
            <div className="flex items-end justify-between w-full max-w-md">
              <div className="text-center">
                <div className="w-32 border-t border-[#0F1F3D]/20 mb-1.5" />
                <p className="text-xs text-[#64748B]">{certData.completedAt}</p>
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mt-0.5">Date Completed</p>
              </div>

              <div className="text-center">
                <p className="text-lg font-bold text-[#0F1F3D] mb-0.5"
                  style={{ fontFamily: 'Georgia, serif' }}>
                  SmartSkillify
                </p>
                <div className="w-32 border-t border-[#0F1F3D]/20 mb-1.5" />
                <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Authorized Signature</p>
              </div>
            </div>

            {/* Certificate ID */}
            <p className="text-[10px] text-[#94A3B8] mt-10 font-mono">
              Certificate ID: {certData.courseSlug.toUpperCase()}-{user?.id?.slice(-8).toUpperCase()}
            </p>
          </div>

          {/* Bottom accent bar */}
          <div className="h-1 bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#3B82F6]" />
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate { position: fixed; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </main>
  )
}