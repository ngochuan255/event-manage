"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/lib/types/database.types";

type LogWithActor = AuditLog & { profiles?: { full_name: string } | null };

const ACTION_TONE: Record<string, "success" | "warning" | "danger" | "brand" | "neutral"> = {
  CHECK_IN: "success",
  FLAGGED_FOR_LOCK_REVIEW: "warning",
  ACCOUNT_LOCKED: "danger",
  ACCOUNT_UNLOCKED: "success",
};

export function AuditLogViewer({ initialLogs }: { initialLogs: LogWithActor[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [logs, setLogs] = useState<LogWithActor[]>(initialLogs);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const actionTypes = useMemo(
    () => Array.from(new Set(initialLogs.map((l) => l.action))),
    [initialLogs]
  );

  useEffect(() => {
    const channel = supabase
      .channel("audit-logs-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload) => setLogs((prev) => [payload.new as LogWithActor, ...prev])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filtered = logs.filter((log) => {
    if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
    if (query) {
      const haystack = `${log.action} ${log.target_entity ?? ""} ${JSON.stringify(log.details ?? {})}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input placeholder="Search logs…" value={query} onChange={(e) => setQuery(e.target.value)} className="sm:max-w-xs" />
        <div className="glass flex flex-wrap gap-1 rounded-xl p-1">
          <button
            onClick={() => setActionFilter("ALL")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium",
              actionFilter === "ALL" ? "bg-brand-gradient text-white" : "text-slate-400 hover:text-slate-200"
            )}
          >
            All
          </button>
          {actionTypes.map((action) => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium",
                actionFilter === action ? "bg-brand-gradient text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <Card className="divide-y divide-white/5 p-0">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No matching audit entries.</p>
        ) : (
          filtered.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-4 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slate-500" />
                <div>
                  <p className="text-sm font-medium">
                    {log.profiles?.full_name ?? "System"}{" "}
                    <span className="font-normal text-slate-400">
                      {log.target_entity ? `→ ${log.target_entity}` : ""}
                    </span>
                  </p>
                  {log.details && (
                    <p className="mt-0.5 max-w-md truncate text-xs text-slate-500">{JSON.stringify(log.details)}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge tone={ACTION_TONE[log.action] ?? "neutral"}>{log.action}</Badge>
                <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
