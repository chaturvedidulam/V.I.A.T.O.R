import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Compass,
  LayoutDashboard,
  Map,
  Menu,
  Moon,
  Route,
  Store,
  Sun,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/explore", label: "Explore", icon: Map },
  { to: "/plan", label: "Plan", icon: Route },
  { to: "/discover", label: "Discover", icon: Store },
  { to: "/recommendations", label: "For you", icon: Sparkles },
  { to: "/community", label: "Community", icon: Users },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex shrink-0 items-center gap-2", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <Compass className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold tracking-tight">VIATOR</span>
    </Link>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="transition-premium grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="glass-strong sticky top-0 z-50">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <div className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "transition-premium rounded-xl px-3 py-2 text-sm font-semibold",
                pathname.startsWith(item.to)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {!loading && user && (
            <Link
              to="/profile"
              className="transition-premium hidden shrink-0 items-center gap-2 rounded-xl bg-muted p-1 pr-3 hover:bg-accent sm:flex"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="h-7 w-7 rounded-lg object-cover" />
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-xs text-primary-foreground">
                  {(user.displayName || "U").slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="text-sm font-semibold">{(user.displayName || "Profile").split(" ")[0]}</span>
            </Link>
          )}
          {!loading && !user && (
            <Link to="/login" className="hidden text-sm font-semibold text-primary hover:underline sm:block">
              Sign in
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="transition-premium grid h-9 w-9 place-items-center rounded-xl bg-muted lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-2 lg:hidden">
          <div className="grid gap-1">
            {[
              ...NAV_ITEMS,
              { to: "/profile", label: "Profile", icon: Users },
              { to: "/settings", label: "Settings", icon: Compass },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "transition-premium flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
                  pathname.startsWith(item.to)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const groups = [
    {
      title: "Product",
      links: [
        { label: "Explore", to: "/explore" },
        { label: "Route planner", to: "/plan" },
        { label: "Recommendations", to: "/recommendations" },
        { label: "Business discovery", to: "/discover" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Feed", to: "/community" },
        { label: "Leaderboard", to: "/community" },
        { label: "Hidden gems", to: "/explore" },
        { label: "Contributor guide", to: "/community" },
      ],
    },
  ] as const;
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">
              Intelligent navigation for people who care where they end up, not just when.
            </p>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-bold">{group.title}</h3>

              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="transition-premium text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          © 2026 Viator Labs. Prototype build — Firebase and Mapbox not yet connected.
        </p>
      </div>
    </footer>
  );
}

export function AppShell({
  children,
  footer = false,
  padded = true,
}: {
  children: React.ReactNode;
  footer?: boolean;
  padded?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main
        className={cn("flex-1", padded && "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10")}
      >
        {children}
      </main>
      {footer && <Footer />}
    </div>
  );
}
