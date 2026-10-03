"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

/**
 * Supabase client for use in Client Components.
 * Safe to call repeatedly — each call returns a fresh client bound to the
 * same browser storage, which is what @supabase/ssr expects.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
