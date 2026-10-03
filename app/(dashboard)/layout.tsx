import Link from "next/link";
import { CalendarDays, ShieldCheck, Users2 } from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/server";
import { MainHeader } from "@/components/layout/MainHeader";

const BASE_NAV = [{ href: "/events", label: "Events", icon: CalendarDays }];
const ADMIN_NAV = [
  { href: "/admin/audit-logs", label: "Audit log", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users2 },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-50 w-full">
        <MainHeader />
      </div>
      <div className="flex flex-1">
        <aside className="glass hidden w-60 flex-col border-r border-white/5 p-5 md:flex">
          <nav className="space-y-1">
            {(profile?.role === "ADMIN" ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <main className="px-6 py-8 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
