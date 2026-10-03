import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { userId, locked } = (await request.json()) as {
    userId: string;
    locked: boolean;
  };

  // Authenticate the caller
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Verify ADMIN role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch the target user's name for the audit log
  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  // Update the lock status using admin client (bypasses RLS guard trigger)
  const { error: updateError } = await admin
    .from("profiles")
    .update({ is_locked: locked })
    .eq("id", userId);

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 400 });

  // Write audit log server-side
  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: locked ? "ACCOUNT_LOCKED" : "ACCOUNT_UNLOCKED",
    target_entity: "profiles",
    target_id: userId,
    details: { full_name: target?.full_name ?? "Unknown" },
  });

  return NextResponse.json({ success: true });
}
