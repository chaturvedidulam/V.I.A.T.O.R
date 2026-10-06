import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingSearch({
  value,
  onChange,
  onSubmit,
  onFilter,
  placeholder = "Search places, routes or cities",
  showFilter = true,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  onFilter?: () => void;
  placeholder?: string;
  showFilter?: boolean;
  className?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn(
        "glass-strong transition-premium flex items-center gap-2 rounded-2xl p-2 shadow-float focus-within:ring-2 focus-within:ring-ring/40",
        className,
      )}
    >
      <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium outline-none placeholder:text-muted-foreground"
      />
      {showFilter && onFilter && (
        <button
          type="button"
          aria-label="Filters"
          onClick={onFilter}
          className="transition-premium grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      )}
      <button
        type="submit"
        className="transition-premium shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Search
      </button>
    </form>
  );
}
