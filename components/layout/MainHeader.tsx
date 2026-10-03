import Link from "next/link";
import { Search, Ticket, ChevronDown, Sparkles, LogOut, Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/LogoutButton";

const categories = [
  "Nhạc sống",
  "Sân khấu & Nghệ thuật",
  "Thể Thao",
  "Hội thảo & Workshop",
  "Tham quan & Trải nghiệm",
  "Khác",
];

export async function MainHeader() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);

  const isAdminOrOrganizer = profile?.role === "ADMIN" || profile?.role === "ORGANIZER";

  return (
    <header className="w-full font-sans">
      {/* Top Green Bar */}
      <div className="bg-[#00b14f] px-6 py-3 flex items-center justify-between text-white">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
          <Sparkles size={24} className="text-white" /> Pulse
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-8 relative hidden md:flex items-center">
          <div className="flex w-full bg-white rounded-full overflow-hidden h-10 shadow-sm text-slate-800 focus-within:ring-2 focus-within:ring-[#00b14f]">
            <div className="flex items-center justify-center pl-4 pr-2 text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Bạn tìm gì hôm nay?"
              className="flex-1 bg-transparent border-none focus:outline-none px-2 text-sm"
            />
            <button className="bg-white px-6 border-l border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors">
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {isAdminOrOrganizer && (
            <Link href="/events/new" className="rounded-full border border-white text-white hover:bg-white hover:text-[#00b14f] bg-transparent font-medium h-9 hidden lg:flex items-center px-4 text-sm transition-colors">
              Tạo sự kiện
            </Link>
          )}

          {user && (
            <Link href="/my-tickets" className="flex items-center gap-2 text-sm font-medium hover:text-white/80 transition-colors hidden sm:flex">
              <Ticket size={18} /> Vé của tôi
            </Link>
          )}

          {user ? (
            <div className="group relative">
              <button className="flex items-center gap-2 text-sm font-medium hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs">{profile?.full_name?.charAt(0) || "U"}</span>
                  </div>
                )}
                Tài khoản <ChevronDown size={14} />
              </button>
              
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 hidden group-hover:flex flex-col py-2 z-50 text-slate-800 dark:text-slate-200">
                <Link href="/my-tickets" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                  <Ticket size={16} className="text-slate-400" /> Vé của tôi
                </Link>
                {isAdminOrOrganizer && (
                  <Link href="/events" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                    <Calendar size={16} className="text-slate-400" /> Sự kiện của tôi
                  </Link>
                )}
                <div className="w-full border-t border-slate-100 dark:border-white/5 my-1"></div>
                <div className="px-2">
                  <LogoutButton variant="ghost" className="w-full justify-start text-sm hover:bg-slate-100 dark:hover:bg-white/5 rounded-md px-2 h-9" />
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login" className="rounded-full border border-white text-white hover:bg-white hover:text-[#00b14f] bg-transparent font-medium h-9 flex items-center px-4 text-sm transition-colors">
              Đăng nhập
            </Link>
          )}

          <div className="flex items-center ml-2 border-l border-white/20 pl-4">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Bottom Black Bar */}
      <div className="bg-black text-slate-200 overflow-x-auto">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex items-center gap-6 whitespace-nowrap text-sm font-medium h-12">
            {categories.map((cat, idx) => (
              <Link key={idx} href={`/events?category=${encodeURIComponent(cat)}`} className="hover:text-white transition-colors">
                {cat}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
