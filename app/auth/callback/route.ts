import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("OAuth code exchange failed:", exchangeError.message);
        return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
      }

      // Profile creation is now handled by the database trigger
      // `on_auth_user_created` (see 0003_security_fixes.sql).
      // No manual insert needed — the trigger fires atomically on
      // auth.users INSERT, guaranteeing the profile row exists.
    } catch (err) {
      console.error("Unexpected error during OAuth callback:", err);
      return NextResponse.redirect(new URL("/login?error=unexpected", request.url));
    }
  }

  return NextResponse.redirect(new URL("/events", request.url));
}
