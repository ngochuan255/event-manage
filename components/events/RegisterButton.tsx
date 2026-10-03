"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RegisterButtonProps {
  eventId: string;
  isAuthenticated: boolean;
  registrationDeadline: string;
  existingStatus: string | null;
}

export function RegisterButton({ eventId, isAuthenticated, registrationDeadline, existingStatus }: RegisterButtonProps) {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deadlinePassed = new Date() > new Date(registrationDeadline);

  if (!isAuthenticated) {
    return (
      <Link href="/login">
        <Button>Log in to register</Button>
      </Link>
    );
  }

  if (existingStatus) {
    return (
      <Button variant="glass" disabled>
        <Ticket size={16} /> {existingStatus === "CHECKED_IN" ? "Checked in" : "Registered"}
      </Button>
    );
  }

  async function handleRegister() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not register");
      setQrDataUrl(data.qrDataUrl);
      setOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <Button onClick={handleRegister} disabled={loading || deadlinePassed}>
          <Ticket size={16} /> {deadlinePassed ? "Registration closed" : loading ? "Registering…" : "Register"}
        </Button>
        {error && <p className="text-xs text-status-danger">{error}</p>}
      </div>

      <AnimatePresence>
        {open && qrDataUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-sm p-6 text-center">
                <div className="mb-3 flex justify-end">
                  <button onClick={() => setOpen(false)} aria-label="Close">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>
                <h3 className="font-display text-lg font-semibold">You&apos;re in!</h3>
                <p className="mb-4 text-sm text-slate-400">Show this QR code at check-in.</p>
                <Image src={qrDataUrl} alt="Ticket QR code" width={240} height={240} className="mx-auto rounded-xl bg-white p-3" />
                <a href={qrDataUrl} download="ticket-qr.png" className="mt-4 inline-block">
                  <Button variant="glass" size="sm">
                    <Download size={14} /> Save QR code
                  </Button>
                </a>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
