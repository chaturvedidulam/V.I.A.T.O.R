import { cn } from "@/lib/utils";

export function FilterChips({
  options,
  value,
  onChange,
  multi = true,
  className,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
  className?: string;
}) {
  const toggle = (option: string) => {
    if (!multi) {
      onChange(value[0] === option ? [] : [option]);
      return;
    }
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  };

  return (
    <div className={cn("no-scrollbar flex items-center gap-2 overflow-x-auto", className)}>
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option)}
            className={cn(
              "transition-premium shrink-0 rounded-full border px-4 py-2 text-sm font-medium",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-soft"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex w-full gap-1 rounded-xl bg-muted p-1", className)}>
      {options.map((o) => {
        const Icon = o.icon;
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "transition-premium flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
              active
                ? "bg-card text-primary shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
