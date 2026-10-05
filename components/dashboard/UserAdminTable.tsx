"use client";

import { useMemo, useState } from "react";
import { Lock, Search, ShieldAlert, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types/database.types";

export function UserAdminTable({ initialUsers, currentAdminId }: { initialUsers: Profile[]; currentAdminId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);

  const filtered = users.filter((u) => u.full_name.toLowerCase().includes(query.toLowerCase()));

  async function toggleLock(user: Profile) {
    setPendingId(user.id);
    const nextLocked = !user.is_locked;

    try {
      const res = await fetch("/api/admin/toggle-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, locked: nextLocked }),
      });

      if (!res.ok) {
        const body = await res.json();
        toast.error(body.error ?? "Failed to update user");
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_locked: nextLocked } : u)));
      toast.success(`${user.full_name} ${nextLocked ? "locked" : "unlocked"}`);
    } catch (err) {
      toast.error("Network error — please try again");
    } finally {
      setPendingId(null);
    }
  }

  async function changeRole(user: Profile, newRole: Profile["role"]) {
    if (user.id === currentAdminId) return; // Admins shouldn't change their own role here
    
    setPendingRoleId(user.id);

    try {
      const res = await fetch("/api/admin/change-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newRole }),
      });

      if (!res.ok) {
        const body = await res.json();
        toast.error(body.error ?? "Failed to update role");
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error("Network error — please try again");
    } finally {
      setPendingRoleId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <Input placeholder="Search users…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      <Card className="divide-y divide-white/5 p-0">
        {filtered.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                {user.full_name}
                <select
                  value={user.role}
                  onChange={(e) => changeRole(user, e.target.value as Profile["role"])}
                  disabled={user.id === currentAdminId || pendingRoleId === user.id}
                  className="bg-transparent border border-white/10 rounded px-2 py-0.5 text-xs font-medium focus:outline-none focus:border-white/20 disabled:opacity-50"
                >
                  <option value="ADMIN" className="bg-slate-900">ADMIN</option>
                  <option value="ORGANIZER" className="bg-slate-900">ORGANIZER</option>
                  <option value="ATTENDEE" className="bg-slate-900">ATTENDEE</option>
                </select>
                {user.no_show_count >= 3 && (
                  <span className="flex items-center gap-1 text-xs text-status-warning">
                    <ShieldAlert size={12} /> {user.no_show_count} no-shows
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500">
                {user.is_locked ? "Locked — cannot sign in or register" : "Active"}
              </p>
            </div>
            <Button
              variant={user.is_locked ? "primary" : "outline"}
              size="sm"
              disabled={pendingId === user.id}
              onClick={() => toggleLock(user)}
            >
              {user.is_locked ? <Unlock size={14} /> : <Lock size={14} />}
              {user.is_locked ? "Unlock" : "Lock"}
            </Button>
          </div>
        ))}
        {filtered.length === 0 && <p className="p-6 text-center text-sm text-slate-400">No users match.</p>}
      </Card>
    </div>
  );
}
