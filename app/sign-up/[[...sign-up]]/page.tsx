import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FF] flex items-center justify-center px-6 pt-16">
      <SignUp />
    </main>
  )
}