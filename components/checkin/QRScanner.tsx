"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ScanLine, ShieldAlert, TimerReset, XCircle } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CheckinResult } from "@/app/api/checkin/route";

interface ScanEntry {
  id: string;
  result: CheckinResult;
  at: number;
}

const FEEDBACK: Record<
  CheckinResult["outcome"],
  { label: string; tone: string; icon: typeof CheckCircle2; vibrate: number[]; tone_hz: number }
> = {
  SUCCESS: { label: "Checked in", tone: "text-status-success", icon: CheckCircle2, vibrate: [40], tone_hz: 880 },
  ALREADY_CHECKED_IN: {
    label: "Already checked in",
    tone: "text-status-warning",
    icon: TimerReset,
    vibrate: [30, 60, 30],
    tone_hz: 440,
  },
  WRONG_EVENT: {
    label: "Wrong event",
    tone: "text-status-danger",
    icon: ShieldAlert,
    vibrate: [30, 60, 30, 60],
    tone_hz: 220,
  },
  INVALID: {
    label: "Invalid ticket",
    tone: "text-status-danger",
    icon: XCircle,
    vibrate: [30, 60, 30, 60],
    tone_hz: 180,
  },
};

/** Beeps via WebAudio so we don't need to ship an audio file. */
function playTone(frequency: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Audio isn't critical to the check-in flow — fail silently.
  }
}

export function QRScanner({ eventId }: { eventId: string }) {
  const containerId = "qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [log, setLog] = useState<ScanEntry[]>([]);
  const [flash, setFlash] = useState<ScanEntry | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus("starting");
      const { Html5Qrcode: QrScanner } = await import("html5-qrcode");
      if (cancelled) return;

      const scanner = new QrScanner(containerId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => handleScan(decodedText),
          () => {
            /* per-frame "no QR found" callback — expected, ignore */
          }
        );
        if (!cancelled) setStatus("scanning");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    start();
    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScan(token: string) {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, eventId }),
      });
      const result = (await res.json()) as CheckinResult;
      const entry: ScanEntry = { id: crypto.randomUUID(), result, at: Date.now() };

      setFlash(entry);
      setLog((prev) => [entry, ...prev].slice(0, 20));

      const feedback = FEEDBACK[result.outcome];
      playTone(feedback.tone_hz);
      if ("vibrate" in navigator) navigator.vibrate(feedback.vibrate);

      setTimeout(() => setFlash((f) => (f?.id === entry.id ? null : f)), 2200);
    } finally {
      // Debounce so the same frame can't fire twice in a row.
      setTimeout(() => (busyRef.current = false), 1200);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <Card className="relative overflow-hidden p-4">
        <div id={containerId} className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl" />
        {status === "error" && (
          <p className="mt-3 text-center text-sm text-status-danger">
            Couldn&apos;t access the camera. Check browser permissions and reload.
          </p>
        )}
        {status !== "error" && (
          <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-slate-400">
            <ScanLine size={14} className={status === "scanning" ? "animate-pulse" : ""} />
            {status === "scanning" ? "Point the camera at a ticket QR code" : "Starting camera…"}
          </p>
        )}

        <AnimatePresence>
          {flash && (
            <motion.div
              key={flash.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg-dark/90 backdrop-blur-sm",
                FEEDBACK[flash.result.outcome].tone
              )}
            >
              {(() => {
                const Icon = FEEDBACK[flash.result.outcome].icon;
                return <Icon size={56} className={flash.result.outcome === "SUCCESS" ? "animate-pulse-ring rounded-full" : ""} />;
              })()}
              <p className="text-lg font-semibold text-white">{FEEDBACK[flash.result.outcome].label}</p>
              {"attendeeName" in flash.result && flash.result.attendeeName && (
                <p className="text-sm text-slate-300">{flash.result.attendeeName}</p>
              )}
              {flash.result.outcome === "INVALID" && (
                <p className="text-xs text-slate-400">{flash.result.reason}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card className="p-4">
        <h4 className="mb-3 font-display font-semibold">Recent scans</h4>
        {log.length === 0 ? (
          <p className="text-sm text-slate-400">Scans will appear here as they come in.</p>
        ) : (
          <ul className="space-y-2">
            {log.map((entry) => {
              const feedback = FEEDBACK[entry.result.outcome];
              const Icon = feedback.icon;
              return (
                <li key={entry.id} className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Icon size={14} className={feedback.tone} />
                    {"attendeeName" in entry.result ? entry.result.attendeeName : "Unknown"}
                  </span>
                  <span className={cn("text-xs", feedback.tone)}>{feedback.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
