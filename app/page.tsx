import Link from "next/link";
import { ArrowRight, QrCode, Radio, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/supabase/server";
import { MainHeader } from "@/components/layout/MainHeader";

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-brand-gradient-radial" />

      <div className="relative z-20">
        <MainHeader />
      </div>

      <section className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-20 pt-16 text-center">
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">
          Hệ Thống Quản Lý Sự Kiện Và Kiểm Soát Tham Dự
        </h1>
        <p className="mt-5 max-w-xl text-slate-400">
          Lên kế hoạch chương trình, phát hành vé QR được xác thực an toàn và theo dõi tình hình tham dự theo thời gian thực khi khách mời lần lượt bước qua cổng.

        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/events" className="inline-flex items-center justify-center gap-2 rounded-xl text-base font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo bg-brand-gradient text-white shadow-lg shadow-brand-indigo/20 hover:brightness-110 h-12 px-6">
            Browse events <ArrowRight size={16} />
          </Link>
          {!user && (
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl text-base font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo glass glass-hover h-12 px-6">
              Create an account
            </Link>
          )}
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-3">
        <Card className="p-6">
          <QrCode className="text-brand-indigo" />
          <h3 className="mt-3 font-display font-semibold">Signed QR tickets</h3>
          <p className="mt-1 text-sm text-slate-400">
            Mỗi vé đều được bảo vệ bằng chữ ký HMAC, đảm bảo không thể sao chép hay giả mạo.
          </p>
        </Card>
        <Card className="p-6">
          <Radio className="text-brand-violet" />
          <h3 className="mt-3 font-display font-semibold">Realtime attendance</h3>
          <p className="mt-1 text-sm text-slate-400">
            Số lượt check-in được cập nhật tức thì trên mọi màn hình đang kết nối.
          </p>
        </Card>
        <Card className="p-6">
          <Users className="text-status-success" />
          <h3 className="mt-3 font-display font-semibold">Role-based access</h3>
          <p className="mt-1 text-sm text-slate-400">
            Quản trị viên, ban tổ chức và khách tham dự đều thấy đúng những gì họ cần.
          </p>
        </Card>
      </section>
    </main>
  );
}
