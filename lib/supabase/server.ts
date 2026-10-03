import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Reads/writes the auth session via the request's cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no writable cookie jar —
            // safe to ignore as long as middleware refreshes the session.
          }
        },
      },
    }
  );
}

/**
 * Current user, memoized for the lifetime of one server request. Layout,
 * header and page all call this, but Supabase Auth is hit only once.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Current user's profile row, memoized per request (one query, shared). */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url")
    .eq("id", user.id)
    .single();
  return data;
});

/**
 * Elevated client for trusted server-only code (Route Handlers, Edge
 * Functions) that must bypass RLS — e.g. verifying a ticket signature and
 * flipping status regardless of who currently "owns" the row.
 * NEVER import this into a Client Component or expose the key to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
