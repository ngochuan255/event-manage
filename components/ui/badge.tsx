import { cn } from "@/lib/utils";

type BadgeTone = "success" | "warning" | "danger" | "neutral" | "brand";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-status-success/15 text-status-success border-status-success/30",
  warning: "bg-status-warning/15 text-status-warning border-status-warning/30",
  danger: "bg-status-danger/15 text-status-danger border-status-danger/30",
  neutral: "bg-white/5 text-slate-300 border-white/10",
  brand: "bg-brand-indigo/15 text-brand-indigo border-brand-indigo/30",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
