import AdminSidebar from "@/components/admin/Sidebar";
import { auth } from "@clerk/nextjs/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (userId !== process.env.ADMIN_USER_ID) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar stays fixed */}
      <AdminSidebar />

      {/* 1. ml-64: Still needed to stay to the right of the sidebar.
        2. pt-8: A small gap (32px) so it looks professional.
        3. px-8: Keeps the horizontal breathing room.
      */}
      <main className="ml-64 pt-8 min-h-screen">
        <div className="px-8 pb-12 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}