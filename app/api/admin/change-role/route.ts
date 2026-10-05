import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { userId, newRole } = (await request.json()) as {
    userId: string;
    newRole: "ADMIN" | "ORGANIZER" | "ATTENDEE";
  };

  if (!["ADMIN", "ORGANIZER", "ATTENDEE"].includes(newRole)) {
    return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
  }

  // Authenticate the caller
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Prevent admin from changing their own role
  if (user.id === userId) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 403 });
  }

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

  // Update the role using admin client (bypasses RLS guard trigger)
  const { error: updateError } = await admin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 400 });

  // Write audit log server-side
  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "ROLE_CHANGED",
    target_entity: "profiles",
    target_id: userId,
    details: { full_name: target?.full_name ?? "Unknown", new_role: newRole },
  });

  return NextResponse.json({ success: true });
}
