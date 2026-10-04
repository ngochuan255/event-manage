import { redirect } from "next/navigation";
import { MainHeader } from "@/components/layout/MainHeader";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

/** Shared shell for /account/* and /my-tickets: header + sidebar. Each page renders its own breadcrumb. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-50 w-full">
        <MainHeader />
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
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
