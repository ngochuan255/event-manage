"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError || !data.user) {
      setLoading(false);
      setError(signUpError?.message ?? "Could not create account");
      return;
    }

    // Profile row is now created automatically by the database trigger
    // `on_auth_user_created` (see 0003_security_fixes.sql).
    // This eliminates the race condition where auth succeeds but profile insert fails.

    setLoading(false);

    router.push("/events");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm p-6">
        <h1 className="font-display text-xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-400">Register to attend or organize events.</p>

        <form onSubmit={handleRegister} className="mt-5 space-y-3">
          <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            type="password"
            placeholder="Password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-indigo">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
