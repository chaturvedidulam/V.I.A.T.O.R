import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, X } from "lucide-react";

/**
 * BottomSheet — draggable-feel sheet for mobile, static panel on desktop.
 * Uses a collapsed/expanded snap model rather than raw pointer dragging so it
 * stays predictable inside a scrolling page.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (open) setExpanded(true);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "glass-strong transition-premium absolute inset-x-0 bottom-0 z-40 flex flex-col rounded-t-3xl shadow-lift",
        "lg:inset-y-4 lg:right-4 lg:left-auto lg:w-[26rem] lg:rounded-3xl",
        expanded ? "max-h-[72%]" : "max-h-[30%]",
        className,
      )}
      role="dialog"
      aria-label={title ?? "Details"}
    >
      <div className="flex items-center gap-3 px-5 pb-2 pt-3">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? "Collapse sheet" : "Expand sheet"}
          className="mx-auto flex items-center gap-2 rounded-full px-3 py-1 text-muted-foreground hover:bg-accent lg:hidden"
        >
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="transition-premium ml-auto grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">{children}</div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="hidden items-center justify-center gap-1 border-t border-border py-2 text-xs font-semibold text-muted-foreground lg:flex"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        {expanded ? "Collapse" : "Expand"}
      </button>
    </div>
  );
}
