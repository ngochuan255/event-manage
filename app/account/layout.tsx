import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { MainHeader } from "@/components/layout/MainHeader";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  if (!user) redirect("/login?next=/account/profile");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-50 w-full">
        <MainHeader />
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-[#00b14f]">Trang chủ</Link>
          <ChevronRight size={14} />
          <span>Cài đặt tài khoản</span>
          <ChevronRight size={14} />
          <span className="font-medium text-slate-900 dark:text-slate-100">Thông tin tài khoản</span>
        </nav>

        <div className="flex flex-col gap-10 md:flex-row">
          <AccountSidebar
            fullName={profile?.full_name ?? user.email ?? "Người dùng"}
            showMyEvents={profile?.role === "ADMIN" || profile?.role === "ORGANIZER"}
          />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
