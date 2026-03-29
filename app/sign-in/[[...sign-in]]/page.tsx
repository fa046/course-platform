import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FF] flex items-center justify-center px-6 pt-16">
      <SignIn />
    </main>
  )
}