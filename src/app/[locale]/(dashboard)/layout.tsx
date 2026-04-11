import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ProfileGate } from "@/components/profile/ProfileGate";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden">{children}</main>
      </div>
      <BottomTabBar />
      <ProfileGate />
    </SidebarProvider>
  );
}
