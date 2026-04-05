import CourseForm from '@/components/admin/CourseForm'

export default function NewCoursePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F1F3D]">New Course</h1>
        <p className="text-gray-500 mt-1">Fill in the details to create a new course.</p>
      </div>
      <CourseForm />
    </div>
  )
}