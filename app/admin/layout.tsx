import AdminSidebar from "@/components/admin/Sidebar";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function isAdmin(userId: string | null) {
  if (!userId) return false;

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  return data?.role === "admin";
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // 🔐 Supabase role-based check (FINAL SYSTEM)
  if (!(await isAdmin(userId))) {
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
      <AdminSidebar />

      <main className="ml-64 pt-8 min-h-screen">
        <div className="px-8 pb-12 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
