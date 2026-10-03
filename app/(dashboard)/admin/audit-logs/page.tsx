import { redirect } from "next/navigation";
import { createClient, getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { AuditLogViewer } from "@/components/dashboard/AuditLogViewer";

export const revalidate = 0;

export default async function AuditLogsPage() {
  const supabase = await createClient();
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  if (!user) redirect("/login?next=/admin/audit-logs");
  if (profile?.role !== "ADMIN") redirect("/events");

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-slate-400">Every administrative action, live as it happens.</p>
      </div>
      <AuditLogViewer initialLogs={logs ?? []} />
    </div>
  );
}
