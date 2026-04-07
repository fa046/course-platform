import BlogPostForm from '@/components/admin/BlogPostForm'
import Link from 'next/link'

export default function NewBlogPostPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <Link href="/admin/blog" className="hover:text-[#2563EB]">Blog</Link>
          <span>/</span>
          <span>New Post</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0F1F3D]">New Blog Post</h1>
      </div>
      <BlogPostForm />
    </div>
  )
}