"use client";

import { motion } from "framer-motion";
import { CheckCircle2, CircleDot, Users, UserX, Wifi, WifiOff } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { useRealtimeAttendance } from "@/hooks/useRealtimeAttendance";
import { cn } from "@/lib/utils";

interface StatDef {
  label: string;
  value: number;
  icon: typeof Users;
  tone: string;
  pulse?: boolean;
}

export function RealtimeAnalyticsDashboard({
  eventId,
  eventTitle,
  capacity,
}: {
  eventId: string;
  eventTitle: string;
  capacity: number;
}) {
  const { snapshot, connected, loading } = useRealtimeAttendance(eventId);
  const attendanceRate = snapshot.total > 0 ? Math.round((snapshot.checkedIn / snapshot.total) * 100) : 0;
  const capacityRate = capacity > 0 ? Math.round((snapshot.total / capacity) * 100) : 0;

  const stats: StatDef[] = [
    { label: "Registered", value: snapshot.total, icon: Users, tone: "text-brand-indigo" },
    { label: "Checked in", value: snapshot.checkedIn, icon: CheckCircle2, tone: "text-status-success", pulse: true },
    { label: "No-shows", value: snapshot.noShow, icon: UserX, tone: "text-status-danger" },
    { label: "Awaiting", value: snapshot.registered, icon: CircleDot, tone: "text-status-warning" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">{eventTitle}</h3>
          <p className="text-sm text-slate-400">Live attendance</p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
            connected ? "border-status-success/30 text-status-success" : "border-status-warning/30 text-status-warning"
          )}
        >
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? "Live" : "Reconnecting…"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4">
              <div className={cn("flex items-center gap-2 text-xs", stat.tone)}>
                <stat.icon size={14} className={stat.pulse && !loading ? "animate-pulse" : ""} />
                {stat.label}
              </div>
              <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
                {loading ? "–" : stat.value}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-slate-400">Check-in rate</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-display text-4xl font-semibold">{attendanceRate}%</span>
            <span className="mb-1 text-xs text-slate-500">of registered attendees</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${attendanceRate}%` }} />
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-400">Capacity filled</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-display text-4xl font-semibold">{capacityRate}%</span>
            <span className="mb-1 text-xs text-slate-500">
              {snapshot.total}/{capacity} spots
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={cn("h-full rounded-full transition-all", capacityRate >= 90 ? "bg-status-danger" : "bg-brand-gradient")}
              style={{ width: `${Math.min(100, capacityRate)}%` }}
            />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <p className="mb-3 text-sm text-slate-400">Check-ins over time</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={snapshot.history}>
              <defs>
                <linearGradient id="checkinFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" stroke="rgba(148,163,184,0.5)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(148,163,184,0.5)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(11,15,23,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="checkedIn" stroke="#8B5CF6" strokeWidth={2} fill="url(#checkinFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
