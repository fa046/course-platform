import Link from "next/link";

const stats = [
  { value: "12,000+", label: "Students Enrolled" },
  { value: "48", label: "Expert Courses" },
  { value: "4.9★", label: "Average Rating" },
  { value: "92%", label: "Completion Rate" },
];

const categories = [
  { icon: "◈", name: "Design", count: "12 courses" },
  { icon: "◉", name: "Development", count: "18 courses" },
  { icon: "◎", name: "Business", count: "8 courses" },
  { icon: "◐", name: "Marketing", count: "10 courses" },
];

const featuredCourses = [
  {
    id: 1,
    badge: "Bestseller",
    title: "Complete UI/UX Design Masterclass",
    instructor: "Sarah Ahmed",
    price_pkr: 4999,
    price_usd: 19,
    rating: 4.9,
    students: 3240,
    duration: "24h 30m",
    is_free: false,
    level: "Beginner",
  },
  {
    id: 2,
    badge: "Free",
    title: "Introduction to Web Development",
    instructor: "Ali Hassan",
    price_pkr: 0,
    price_usd: 0,
    rating: 4.7,
    students: 5800,
    duration: "8h 15m",
    is_free: true,
    level: "Beginner",
  },
  {
    id: 3,
    badge: "New",
    title: "Advanced React & Next.js 2025",
    instructor: "Zara Khan",
    price_pkr: 6999,
    price_usd: 25,
    rating: 4.8,
    students: 1120,
    duration: "32h 00m",
    is_free: false,
    level: "Advanced",
  },
  {
    id: 4,
    badge: null,
    title: "Digital Marketing Strategy",
    instructor: "Omar Farooq",
    price_pkr: 3499,
    price_usd: 15,
    rating: 4.6,
    students: 2670,
    duration: "16h 45m",
    is_free: false,
    level: "Intermediate",
  },
];

const testimonials = [
  {
    name: "Ayesha Malik",
    role: "UX Designer at Techify",
    text: "The courses here completely transformed my career. The content is world-class and the instructors actually care about your growth.",
    avatar: "AM",
  },
  {
    name: "Bilal Chaudhry",
    role: "Freelance Developer",
    text: "I went from knowing nothing about code to landing my first client in 3 months. Worth every rupee.",
    avatar: "BC",
  },
  {
    name: "Hira Baig",
    role: "Marketing Manager",
    text: "The digital marketing course gave me practical skills I used immediately. ROI on this investment was incredible.",
    avatar: "HB",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8F9FF] text-[#0F1F3D] overflow-x-hidden">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#0F1F3D]/8 bg-[#F8F9FF]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-[#0F1F3D]">LearnSmart</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/courses" className="text-sm text-[#0F1F3D]/60 hover:text-[#0F1F3D] transition-colors">Courses</Link>
            <Link href="/blog" className="text-sm text-[#0F1F3D]/60 hover:text-[#0F1F3D] transition-colors">Blog</Link>
            <Link href="/about" className="text-sm text-[#0F1F3D]/60 hover:text-[#0F1F3D] transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-[#0F1F3D]/70 hover:text-[#0F1F3D] transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/sign-up" className="text-sm bg-[#2563EB] text-white font-medium px-4 py-2 rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm shadow-[#2563EB]/20">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
              <Link href="/courses" className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#1D4ED8] transition-all hover:scale-[1.02] text-base shadow-lg shadow-[#2563EB]/25">
                Browse all courses
                <span className="text-lg">→</span>
              </Link>
              <Link href="/courses?free=true" className="inline-flex items-center justify-center gap-2 bg-white border border-[#0F1F3D]/10 text-[#0F1F3D] font-medium px-8 py-4 rounded-xl hover:bg-[#0F1F3D]/5 transition-all text-base shadow-sm">
                Start for free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-[#0F1F3D]/8 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-[#2563EB] mb-1">{stat.value}</div>
                <div className="text-sm text-[#64748B]">{stat.label}</div>
              </div>
            ))}
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
              <Link key={cat.name} href={`/courses?category=${cat.name.toLowerCase()}`}
                className="group p-6 bg-white border border-[#0F1F3D]/8 rounded-2xl hover:border-[#2563EB]/40 hover:shadow-lg hover:shadow-[#2563EB]/8 transition-all cursor-pointer">
                <div className="text-3xl mb-4 text-[#2563EB]">{cat.icon}</div>
                <div className="font-semibold text-[#0F1F3D] mb-1">{cat.name}</div>
                <div className="text-sm text-[#64748B]">{cat.count}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}
                className="group bg-[#F8F9FF] border border-[#0F1F3D]/8 rounded-2xl overflow-hidden hover:border-[#2563EB]/30 hover:shadow-xl hover:shadow-[#2563EB]/10 transition-all hover:translate-y-[-2px]">
                <div className="aspect-video bg-gradient-to-br from-[#2563EB]/8 to-[#93C5FD]/15 relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                    <span className="text-[#2563EB] text-xl">▶</span>
                  </div>
                  {course.badge && (
                    <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      course.badge === "Free" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                      course.badge === "Bestseller" ? "bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20" :
                      "bg-violet-50 text-violet-600 border border-violet-200"
                    }`}>
                      {course.badge}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-[#64748B] bg-[#0F1F3D]/5 px-2 py-0.5 rounded-full">{course.level}</span>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-3 text-[#0F1F3D] group-hover:text-[#2563EB] transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-[#64748B] mb-4">{course.instructor}</p>
                  <div className="flex items-center gap-3 text-xs text-[#64748B] mb-4">
                    <span className="text-amber-500">★ {course.rating}</span>
                    <span>·</span>
                    <span>{course.students.toLocaleString()} students</span>
                    <span>·</span>
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#0F1F3D]/8">
                    {course.is_free ? (
                      <span className="text-emerald-600 font-semibold text-sm">Free</span>
                    ) : (
                      <div>
                        <span className="text-[#0F1F3D] font-semibold">Rs. {course.price_pkr.toLocaleString()}</span>
                        <span className="text-[#64748B] text-xs ml-2">/ ${course.price_usd}</span>
                      </div>
                    )}
                    <span className="text-xs text-[#2563EB] group-hover:translate-x-1 transition-transform inline-block">
                      Enroll →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#2563EB] text-sm font-semibold uppercase tracking-widest mb-4">Why LearnSmart</p>
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
                  "Lifetime access to all purchased courses",
                  "Learn in Urdu and English",
                  "Certificate on completion",
                  "Pay in PKR or international currency",
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
                { icon: "◈", title: "Expert Instructors", desc: "Learn from industry professionals with real-world experience" },
                { icon: "◉", title: "Flexible Learning", desc: "Study at your own pace, on any device, any time" },
                { icon: "◎", title: "Community Support", desc: "Join thousands of learners and get help when you need it" },
                { icon: "◐", title: "Practical Projects", desc: "Build real projects and add them to your portfolio" },
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

      {/* Testimonials */}
      <section className="py-20 px-6 bg-[#0F1F3D]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#93C5FD] text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">What our students say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-[#93C5FD]/30 transition-all">
                <div className="flex items-center gap-1 text-[#93C5FD] text-sm mb-4">{"★★★★★"}</div>
                <p className="text-white/70 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2563EB]/30 flex items-center justify-center text-xs font-bold text-[#93C5FD]">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/40">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#F8F9FF]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#0F1F3D]">
            Ready to start
            <span className="text-[#2563EB]"> learning today?</span>
          </h2>
          <p className="text-[#64748B] text-lg mb-10 max-w-xl mx-auto">
            Join over 12,000 students who are already building the skills
            that will shape their future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#1D4ED8] transition-all hover:scale-[1.02] text-base shadow-lg shadow-[#2563EB]/25">
              Create free account →
            </Link>
            <Link href="/courses?free=true" className="inline-flex items-center justify-center gap-2 bg-white border border-[#0F1F3D]/10 text-[#0F1F3D] font-medium px-8 py-4 rounded-xl hover:bg-[#0F1F3D]/5 transition-all text-base shadow-sm">
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
              <span className="text-white font-bold text-xs">E</span>
            </div>
            <span className="font-semibold text-[#0F1F3D]">LearnSmart</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#64748B]">
            <Link href="/courses" className="hover:text-[#2563EB] transition-colors">Courses</Link>
            <Link href="/blog" className="hover:text-[#2563EB] transition-colors">Blog</Link>
            <Link href="/privacy" className="hover:text-[#2563EB] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#2563EB] transition-colors">Terms</Link>
          </div>
          <p className="text-sm text-[#64748B]/50">© 2025 LearnSmart. All rights reserved.</p>
        </div>
      </footer>

    </main>
  );
}