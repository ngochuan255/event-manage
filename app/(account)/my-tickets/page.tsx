import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountBreadcrumb } from "@/components/account/AccountBreadcrumb";
import { MyTicketsView, type MyTicket } from "@/components/account/MyTicketsView";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Vé của tôi | Pulse",
  description: "Xem tất cả vé sự kiện bạn đã đăng ký: sắp diễn ra, đã kết thúc, đã check-in hoặc đã hủy.",
};

export default async function MyTicketsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my-tickets");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, ticket_code, status, created_at, checked_in_at, events(id, title, banner_url, location, is_online, start_date, end_date)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load tickets:", error.message);

  return (
    <section className="space-y-8">
      <AccountBreadcrumb items={["Đơn hàng của tôi", "Vé của tôi"]} />
      <h1 className="border-b border-slate-200 pb-4 font-display text-2xl font-bold dark:border-white/10">
        Vé của tôi
      </h1>
      <MyTicketsView tickets={(data ?? []) as unknown as MyTicket[]} />
    </section>
  );
}
