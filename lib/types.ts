export type Course = {
  id: string
  title: string
  slug: string
  description: string
  thumbnail_url: string | null
  price_pkr: number
  price_usd: number
  is_free: boolean
  is_published: boolean
  paddle_price_id: string | null
  related_blog_url: string | null   // optional blog link admin can set
  created_at: string
  lessons?: Lesson[]
  sections?: CourseSection[]
}

export type CourseSection = {
  id: string
  course_id: string
  title: string
  description: string | null
  position: number
  created_at: string
  lessons?: Lesson[]
}

export type Lesson = {
  id: string
  course_id: string
  section_id: string | null
  title: string
  description: string | null
  content_type: 'video' | 'pdf' | 'file'
  video_url: string | null
  bunny_video_id: string | null
  file_url: string | null
  duration_seconds: number
  position: number
  is_free: boolean
  created_at: string
}

export type LessonProgress = {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  is_completed: boolean
  watch_percent: number
  last_watched_at: string
  created_at: string
}

export type Enrollment = {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  full_name: string | null
  phone: string | null
  city: string | null
}

export type LocalPayment = {
  id: string
  user_id: string
  course_id: string
  amount: number
  payment_method: 'jazzcash' | 'easypaisa' | 'bank_transfer'
  transaction_id: string | null
  proof_image_url: string | null
  student_name: string | null
  student_phone: string | null
  student_city: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  reviewed_at: string | null
  created_at: string
}

export type Payment = {
  id: string
  user_id: string
  course_id: string
  amount: number
  currency: string
  gateway: string
  status: string
  gateway_payment_id: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export type BlogPost = {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  thumbnail_url: string | null
  is_published: boolean
  created_at: string
}

export type User = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
}