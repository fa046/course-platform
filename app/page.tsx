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
    <main className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5A623] flex items-center justify-center">
              <span className="text-black font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">EduVerse</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/courses" className="text-sm text-white/60 hover:text-white transition-colors">Courses</Link>
            <Link href="/blog" className="text-sm text-white/60 hover:text-white transition-colors">Blog</Link>
            <Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/sign-up" className="text-sm bg-[#F5A623] text-black font-medium px-4 py-2 rounded-lg hover:bg-[#F5A623]/90 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#F5A623]/8 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-[#F5A623] rounded-full animate-pulse" />
              <span className="text-sm text-white/70">New courses added every week</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-8">
              Learn skills that
              <span className="block text-[#F5A623]">actually matter.</span>
            </h1>
            <p className="text-xl text-white/50 leading-relaxed max-w-2xl mb-10">
              Expert-led courses in design, development, business and marketing.
              Learn at your own pace, in Urdu and English, from anywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/courses" className="inline-flex items-center justify-center gap-2 bg-[#F5A623] text-black font-semibold px-8 py-4 rounded-xl hover:bg-[#F5A623]/90 transition-all hover:scale-[1.02] text-base">
                Browse all courses
                <span className="text-lg">→</span>
              </Link>
              <Link href="/courses?free=true" className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition-all text-base">
                Start for free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-[#F5A623] mb-1">{stat.value}</div>
                <div className="text-sm text-white/40">{stat.label}</div>
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
              <p className="text-[#F5A623] text-sm font-medium uppercase tracking-widest mb-3">Categories</p>
              <h2 className="text-3xl md:text-4xl font-bold">Browse by topic</h2>
            </div>
            <Link href="/courses" className="hidden md:flex text-sm text-white/50 hover:text-white transition-colors items-center gap-1">
              View all <span>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.name} href={`/courses?category=${cat.name.toLowerCase()}`}
                className="group p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-[#F5A623]/30 hover:bg-white/[0.06] transition-all cursor-pointer">
                <div className="text-3xl mb-4 text-[#F5A623]">{cat.icon}</div>
                <div className="font-semibold text-white mb-1">{cat.name}</div>
                <div className="text-sm text-white/40">{cat.count}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[#F5A623] text-sm font-medium uppercase tracking-widest mb-3">Featured</p>
              <h2 className="text-3xl md:text-4xl font-bold">Top courses</h2>
            </div>
            <Link href="/courses" className="hidden md:flex text-sm text-white/50 hover:text-white transition-colors items-center gap-1">
              View all <span>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}
                className="group bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-white/15 transition-all hover:translate-y-[-2px]">
                <div className="aspect-video bg-gradient-to-br from-white/5 to-white/[0.02] relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/40 text-xl">▶</span>
                  </div>
                  {course.badge && (
                    <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      course.badge === "Free" ? "bg-green-500/20 text-green-400 border border-green-500/20" :
                      course.badge === "Bestseller" ? "bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/20" :
                      "bg-purple-500/20 text-purple-400 border border-purple-500/20"
                    }`}>
                      {course.badge}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{course.level}</span>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug mb-3 text-white group-hover:text-[#F5A623] transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-white/40 mb-4">{course.instructor}</p>
                  <div className="flex items-center gap-3 text-xs text-white/30 mb-4">
                    <span>★ {course.rating}</span>
                    <span>·</span>
                    <span>{course.students.toLocaleString()} students</span>
                    <span>·</span>
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    {course.is_free ? (
                      <span className="text-green-400 font-semibold text-sm">Free</span>
                    ) : (
                      <div>
                        <span className="text-white font-semibold">Rs. {course.price_pkr.toLocaleString()}</span>
                        <span className="text-white/30 text-xs ml-2">/ ${course.price_usd}</span>
                      </div>
                    )}
                    <span className="text-xs text-[#F5A623] group-hover:translate-x-1 transition-transform inline-block">
                      Enroll →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#F5A623] text-sm font-medium uppercase tracking-widest mb-4">Why EduVerse</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Learning designed for
                <span className="text-white/40"> real results</span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-8">
                We believe great education should be accessible to everyone.
                Our courses are built by practitioners, not theorists — people
                who have done the work and know what actually matters.
              </p>
              <div className="space-y-4">
                {[
                  "Lifetime access to all purchased courses",
                  "Learn in Urdu and English",
                  "Certificate on completion",
                  "Pay in PKR or international currency",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#F5A623] text-xs">✓</span>
                    </div>
                    <span className="text-white/70 text-sm">{item}</span>
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
                <div key={item.title} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <div className="text-2xl text-[#F5A623] mb-3">{item.icon}</div>
                  <div className="font-semibold text-sm mb-2">{item.title}</div>
                  <div className="text-xs text-white/40 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#F5A623] text-sm font-medium uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold">What our students say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-1 text-[#F5A623] text-sm mb-4">
                  {"★★★★★"}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F5A623]/20 flex items-center justify-center text-xs font-bold text-[#F5A623]">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-white/40">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to start
            <span className="text-[#F5A623]"> learning today?</span>
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
            Join over 12,000 students who are already building the skills
            that will shape their future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 bg-[#F5A623] text-black font-semibold px-8 py-4 rounded-xl hover:bg-[#F5A623]/90 transition-all hover:scale-[1.02] text-base">
              Create free account →
            </Link>
            <Link href="/courses?free=true" className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition-all text-base">
              Browse free courses
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F5A623] flex items-center justify-center">
                <span className="text-black font-bold text-xs">E</span>
              </div>
              <span className="font-semibold">EduVerse</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-sm text-white/20">© 2025 EduVerse. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </main>
  );
}