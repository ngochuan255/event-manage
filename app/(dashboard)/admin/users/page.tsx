import { redirect } from "next/navigation";
import { createClient, getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { UserAdminTable } from "@/components/dashboard/UserAdminTable";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  if (!user) redirect("/login?next=/admin/users");
  if (profile?.role !== "ADMIN") redirect("/events");

  const { data: users } = await supabase.from("profiles").select("*").order("full_name").limit(50);

  return (
    <div className="space-y-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Users</h1>
        <p className="text-sm text-slate-400">Lock accounts to block sign-in and event registration.</p>
      </div>
      <UserAdminTable initialUsers={users ?? []} currentAdminId={user.id} />
    </div>
  );
}
