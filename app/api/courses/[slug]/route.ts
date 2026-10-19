import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { userId } = await auth()
    let supabase = await createClient()
    let isAdmin = false

    if (userId) {
      const adminClient = createAdminClient()
      const { data: user, error: userError } = await adminClient
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (userError) throw userError
      isAdmin = user?.role === 'admin'

      if (isAdmin) {
        supabase = adminClient
      }
    }

    let courseQuery = supabase
      .from('courses')
      .select('*, lessons(*)')
      .eq('slug', slug)

    if (!isAdmin) {
      courseQuery = courseQuery.eq('is_published', true)
    }

    const { data: course, error } = await courseQuery
      .order('position', { referencedTable: 'lessons', ascending: true })
      .single()

    if (error || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch sections
    const { data: sections } = await supabase
      .from('course_sections')
      .select('*')
      .eq('course_id', course.id)
      .order('position', { ascending: true })

    // Attach lessons to sections
    const sectionsWithLessons = (sections || []).map(section => ({
      ...section,
      lessons: (course.lessons || []).filter((l: any) => l.section_id === section.id),
    }))

    const unsectionedLessons = (course.lessons || []).filter((l: any) => !l.section_id)

    return NextResponse.json({
      course: {
        ...course,
        sections: sectionsWithLessons,
        unsectioned_lessons: unsectionedLessons,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}