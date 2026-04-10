'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import FeaturedBlogSection from '@/components/blog/FeaturedBlogSection'

type Course = {
  id: string
  title: string
  slug: string
  description: string
  thumbnail_url: string | null
  price_pkr: number
  price_usd: number
  is_free: boolean
}

const categories = [
  { icon: '◈', name: 'Design', query: 'design' },
  { icon: '◉', name: 'Development', query: 'development' },
  { icon: '◎', name: 'Business', query: 'business' },
  { icon: '◐', name: 'Marketing', query: 'marketing' },
]

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState({ totalCourses: 0, totalEnrollments: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [coursesRes, statsRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/stats').catch(() => null),
        ])
        const coursesData = await coursesRes.json()
        setCourses(coursesData.courses || [])
        if (statsRes?.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const featuredCourses = courses.slice(0, 4)

  return (
    <main className="min-h-screen bg-[#F8F9FF] text-[#0F1F3D] overflow-x-hidden">

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#2563EB]/6 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-[#93C5FD]/15 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-[#2563EB]/8 border border-[#2563EB]/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse" />
              <span className="text-sm text-[#2563EB] font-medium">New courses added every week</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-8 text-[#0F1F3D]">
              Learn skills that
              <span className="block text-[#2563EB]">actually matter.</span>
            </h1>
            <p className="text-xl text-[#64748B] leading-relaxed max-w-2xl mb-10">
              Expert-led courses in design, development, business and marketing.
              Learn at your own pace, in Urdu and English, from anywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/courses"
                className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#1D4ED8] transition-all hover:scale-[1.02] text-base shadow-lg shadow-[#2563EB]/25">
                Browse all courses <span className="text-lg">→</span>
              </Link>
              <Link href="/courses?free=true"
                className="inline-flex items-center justify-center gap-2 bg-white border border-[#0F1F3D]/10 text-[#0F1F3D] font-medium px-8 py-4 rounded-xl hover:bg-[#0F1F3D]/5 transition-all text-base shadow-sm">
                Start for free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#0F1F3D]/8 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#2563EB] mb-1">
                {loading ? '—' : `${stats.totalEnrollments.toLocaleString()}+`}
              </div>
              <div className="text-sm text-[#64748B]">Students Enrolled</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#2563EB] mb-1">
                {loading ? '—' : stats.totalCourses}
              </div>
              <div className="text-sm text-[#64748B]">Expert Courses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#2563EB] mb-1">Urdu</div>
              <div className="text-sm text-[#64748B]">& English</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#2563EB] mb-1">PKR</div>
              <div className="text-sm text-[#64748B]">Local Payments</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[#2563EB] text-sm font-semibold uppercase tracking-widest mb-3">Categories</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0F1F3D]">Browse by topic</h2>
            </div>
            <Link href="/courses" className="hidden md:flex text-sm text-[#64748B] hover:text-[#2563EB] transition-colors items-center gap-1">
              View all <span>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.name} href={`/courses?search=${cat.query}`}
                className="group p-6 bg-white border border-[#0F1F3D]/8 rounded-2xl hover:border-[#2563EB]/40 hover:shadow-lg hover:shadow-[#2563EB]/8 transition-all cursor-pointer">
                <div className="text-3xl mb-4 text-[#2563EB]">{cat.icon}</div>
                <div className="font-semibold text-[#0F1F3D] mb-1">{cat.name}</div>
                <div className="text-sm text-[#64748B]">
                  {loading ? '...' : `${courses.filter(c => c.title.toLowerCase().includes(cat.query) || c.description?.toLowerCase().includes(cat.query)).length} courses`}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses — real from DB */}
      <section className="py-20 px-6 bg-white border-y border-[#0F1F3D]/8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[#2563EB] text-sm font-semibold uppercase tracking-widest mb-3">Featured</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0F1F3D]">Top courses</h2>
            </div>
            <Link href="/courses" className="hidden md:flex text-sm text-[#64748B] hover:text-[#2563EB] transition-colors items-center gap-1">
              View all <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array(4).fill(null).map((_, i) => (
                <div key={i} className="bg-[#F8F9FF] rounded-2xl overflow-hidden border border-[#0F1F3D]/8 animate-pulse">
                  <div className="aspect-video bg-[#0F1F3D]/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-[#0F1F3D]/5 rounded w-3/4" />
                    <div className="h-3 bg-[#0F1F3D]/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`}
                  className="group bg-[#F8F9FF] border border-[#0F1F3D]/8 rounded-2xl overflow-hidden hover:border-[#2563EB]/30 hover:shadow-xl hover:shadow-[#2563EB]/10 transition-all hover:translate-y-[-2px]">
                  <div className="aspect-video bg-gradient-to-br from-[#2563EB]/8 to-[#93C5FD]/15 relative flex items-center justify-center overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                        <span className="text-[#2563EB] text-xl">▶</span>
                      </div>
                    )}
                    {course.is_free && (
                      <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Free
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-sm leading-snug mb-2 text-[#0F1F3D] group-hover:text-[#2563EB] transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#64748B] mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-[#0F1F3D]/8">
                      {course.is_free ? (
                        <span className="text-emerald-600 font-semibold text-sm">Free</span>
                      ) : (
                        <div>
                          <span className="text-[#0F1F3D] font-semibold text-sm">Rs. {course.price_pkr?.toLocaleString()}</span>
                          <span className="text-[#64748B] text-xs ml-1">/ ${course.price_usd}</span>
                        </div>
                      )}
                      <span className="text-xs text-[#2563EB] group-hover:translate-x-1 transition-transform inline-block">Enroll →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#2563EB] text-sm font-semibold uppercase tracking-widest mb-4">Why SmartSkillify</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-[#0F1F3D]">
                Learning designed for
                <span className="text-[#64748B]"> real results</span>
              </h2>
              <p className="text-[#64748B] leading-relaxed mb-8">
                We believe great education should be accessible to everyone.
                Our courses are built by practitioners — people who have done
                the work and know what actually matters.
              </p>
              <div className="space-y-4">
                {[
                  'Lifetime access to all purchased courses',
                  'Learn in Urdu and English',
                  'Certificate on completion',
                  'Pay in PKR or international currency',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#2563EB] text-xs">✓</span>
                    </div>
                    <span className="text-[#64748B] text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '◈', title: 'Expert Instructors', desc: 'Learn from industry professionals with real-world experience' },
                { icon: '◉', title: 'Flexible Learning', desc: 'Study at your own pace, on any device, any time' },
                { icon: '◎', title: 'Community Support', desc: 'Join thousands of learners and get help when you need it' },
                { icon: '◐', title: 'Practical Projects', desc: 'Build real projects and add them to your portfolio' },
              ].map((item) => (
                <div key={item.title} className="p-5 bg-white border border-[#0F1F3D]/8 rounded-2xl hover:border-[#2563EB]/30 hover:shadow-md transition-all">
                  <div className="text-2xl text-[#2563EB] mb-3">{item.icon}</div>
                  <div className="font-semibold text-sm mb-2 text-[#0F1F3D]">{item.title}</div>
                  <div className="text-xs text-[#64748B] leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <FeaturedBlogSection />

      {/* CTA */}
      <section className="py-24 px-6 bg-[#F8F9FF]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#0F1F3D]">
            Ready to start
            <span className="text-[#2563EB]"> learning today?</span>
          </h2>
          <p className="text-[#64748B] text-lg mb-10 max-w-xl mx-auto">
            Join students who are already building skills that shape their future — in Urdu and English, at their own pace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up"
              className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#1D4ED8] transition-all hover:scale-[1.02] text-base shadow-lg shadow-[#2563EB]/25">
              Create free account →
            </Link>
            <Link href="/courses?free=true"
              className="inline-flex items-center justify-center gap-2 bg-white border border-[#0F1F3D]/10 text-[#0F1F3D] font-medium px-8 py-4 rounded-xl hover:bg-[#0F1F3D]/5 transition-all text-base shadow-sm">
              Browse free courses
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0F1F3D]/8 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-[#0F1F3D]">SmartSkillify</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#64748B]">
            <Link href="/courses" className="hover:text-[#2563EB] transition-colors">Courses</Link>
            <Link href="/blog" className="hover:text-[#2563EB] transition-colors">Blog</Link>
            <Link href="/privacy" className="hover:text-[#2563EB] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#2563EB] transition-colors">Terms</Link>
          </div>
          <p className="text-sm text-[#64748B]/50">© 2025 SmartSkillify. All rights reserved.</p>
        </div>
      </footer>

    </main>
  )
}