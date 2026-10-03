"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RegistrationStatus } from "@/lib/types/database.types";

export interface AttendanceSnapshot {
  total: number;
  checkedIn: number;
  noShow: number;
  cancelled: number;
  registered: number;
  history: Array<{ t: string; checkedIn: number }>;
}

interface AttendanceStats {
  total: number;
  checkedIn: number;
  noShow: number;
  cancelled: number;
  registered: number;
}

interface CheckinHistoryEntry {
  checked_in_at: string;
}

/**
 * Subscribes to postgres_changes on event_registrations, filtered to one
 * event. Uses aggregated count queries instead of loading all rows into
 * client memory, making it suitable for large events.
 */
export function useRealtimeAttendance(eventId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    checkedIn: 0,
    noShow: 0,
    cancelled: 0,
    registered: 0,
  });
  const [history, setHistory] = useState<Array<{ t: string; checkedIn: number }>>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    // Fetch counts per status using separate count queries (lightweight)
    const [total, checkedIn, noShow, cancelled] = await Promise.all([
      supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .neq("status", "CANCELLED"),
      supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "CHECKED_IN"),
      supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "NO_SHOW"),
      supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "CANCELLED"),
    ]);

    const totalCount = total.count ?? 0;
    const checkedInCount = checkedIn.count ?? 0;
    const noShowCount = noShow.count ?? 0;
    const cancelledCount = cancelled.count ?? 0;

    setStats({
      total: totalCount,
      checkedIn: checkedInCount,
      noShow: noShowCount,
      cancelled: cancelledCount,
      registered: totalCount - checkedInCount - noShowCount,
    });

    // Fetch only checkin timestamps for the history chart (not full rows)
    const { data: checkins } = await supabase
      .from("event_registrations")
      .select("checked_in_at")
      .eq("event_id", eventId)
      .eq("status", "CHECKED_IN")
      .not("checked_in_at", "is", null)
      .order("checked_in_at", { ascending: true });

    if (checkins) {
      let running = 0;
      setHistory(
        (checkins as CheckinHistoryEntry[]).map((r) => {
          running += 1;
          const d = new Date(r.checked_in_at);
          return {
            t: d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            checkedIn: running,
          };
        })
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    fetchStats();

    const channel = supabase
      .channel(`event-registrations-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_registrations", filter: `event_id=eq.${eventId}` },
        () => {
          // Coalesce bursts (e.g. a queue of scans at the door) into a single
          // aggregated refetch instead of 5 queries per change.
          clearTimeout(timer);
          timer = setTimeout(() => {
            if (active) fetchStats();
          }, 500);
        }
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      active = false;
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [eventId, supabase]);

  const snapshot: AttendanceSnapshot = {
    ...stats,
    history,
  };

  return { snapshot, connected, loading };
}
