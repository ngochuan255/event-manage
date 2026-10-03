"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Github, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      // is_locked accounts still authenticate against Supabase Auth; the
      // lock is enforced app-side (RLS + registration trigger), so surface
      // a clear message rather than a generic auth error when relevant.
      setError(error.message);
      return;
    }

    router.push(params.get("next") ?? "/events");
    router.refresh();
  }

  async function handleOAuth(provider: "google" | "github") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm p-6">
        <h1 className="font-display text-xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">Log in to manage or attend events.</p>

        <form onSubmit={handleLogin} className="mt-5 space-y-3">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            <Mail size={16} /> {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
          <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-2">
          <Button variant="glass" className="w-full" onClick={() => handleOAuth("google")}>
            Continue with Google
          </Button>
          <Button variant="glass" className="w-full" onClick={() => handleOAuth("github")}>
            <Github size={16} /> Continue with GitHub
          </Button>
        </div>

        <p className="mt-5 text-center text-sm text-slate-400">
          No account?{" "}
          <Link href="/register" className="text-brand-indigo">
            Register
          </Link>
        </p>
      </Card>
    </main>
  );
}
