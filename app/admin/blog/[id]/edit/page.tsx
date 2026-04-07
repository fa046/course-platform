import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import BlogPostForm from '@/components/admin/BlogPostForm'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: post } = await supabase.from('blog_posts').select('*').eq('id', id).single()
  if (!post) notFound()

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <Link href="/admin/blog" className="hover:text-[#2563EB]">Blog</Link>
          <span>/</span>
          <span>Edit Post</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0F1F3D]">Edit Post</h1>
      </div>
      <BlogPostForm initialData={post} />
    </div>
  )
}