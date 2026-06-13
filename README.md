# SmartSkillify

A full-stack online course platform built for a client, aimed at Pakistani students. Students can browse, enroll in, and complete courses with video lessons and progress tracking. Admins manage everything from a single dashboard.

🔗 **Live:** [smartskillify.com](https://www.smartskillify.com)

---

## What it does

**For students:**
- Browse and search courses
- Free courses enroll instantly
- Paid courses via JazzCash, Easypaisa, or Bank Transfer (local) or card via Paddle (international)
- Video lessons with auto-completion at 90% watch time (Bunny Stream)
- PDF viewer and file downloads
- Progress tracking per lesson
- Course completion certificate
- Student dashboard with progress bars

**For admins (`/admin`):**
- Dashboard with stats and recent enrollments
- Create, edit, and delete courses with thumbnail upload
- Manage curriculum — sections and lessons
- Approve or reject local payment proofs (screenshot uploads)
- Manage enrollments manually and export CSV
- Update payment info (JazzCash/Easypaisa/Bank numbers) from the UI
- Blog management — create, edit, publish posts

---

## Payment flow

**Local (PKR):** Student pays via JazzCash / Easypaisa / Bank → uploads screenshot → admin reviews and approves → student gets enrolled + confirmation email

**Card (international):** Student pays via Paddle hosted checkout → webhook auto-enrolls → confirmation email sent automatically

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.1 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Clerk v7 |
| Video | Bunny Stream |
| File/Image storage | Bunny Storage |
| Email | Resend |
| Payments (local) | Manual — JazzCash, Easypaisa, Bank Transfer |
| Payments (card) | Paddle (sandbox tested, production needs KYB) |
| Deployment | Vercel (auto-deploy from GitHub) |

---

## Email automation

Three automated emails via Resend:
- Enrollment confirmation (free courses + Paddle)
- Local payment received — pending review
- Course completion with certificate link

---

## Running locally

```bash
git clone https://github.com/fa046/course-platform
cd course-platform
npm install
```

Create a `.env.local` file and add your keys:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
RESEND_API_KEY=
PADDLE_API_KEY=
NEXT_PUBLIC_BUNNY_STREAM_URL=
```

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Notes

- Paddle card payments are sandbox tested. Going live requires KYB (Know Your Business) verification with Paddle.
- Local payment approval is fully manual — admin reviews uploaded screenshots before enrolling students.
- Video delivery and image hosting use Bunny CDN for fast global delivery.
