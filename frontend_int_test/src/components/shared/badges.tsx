import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIBadge({ label = "AI pick", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </span>
  );
}

export function GemBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-warning px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-warning-foreground",
        className,
      )}
    >
      Hidden gem
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-success",
        className,
      )}
    >
      Verified
    </span>
  );
}
