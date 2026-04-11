import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { AdminBottomTabBar } from "@/components/admin/AdminBottomTabBar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "super_admin") redirect("/login");
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden">{children}</main>
      </div>
      <AdminBottomTabBar />
    </SidebarProvider>
  );
}
