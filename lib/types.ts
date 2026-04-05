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
  created_at: string
  lessons?: Lesson[]
}

export type Lesson = {
  id: string
  course_id: string
  title: string
  description: string | null
  content_type: 'video' | 'pdf' | 'file'  // what kind of content
  video_url: string | null                  // direct video URL (fallback)
  bunny_video_id: string | null             // Bunny Stream video GUID
  file_url: string | null                   // PDF / file URL on Bunny Storage
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