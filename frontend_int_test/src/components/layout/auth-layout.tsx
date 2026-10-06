import { Link } from "@tanstack/react-router";
import { Logo, ThemeToggle } from "@/components/layout/app-shell";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Illustration panel */}
      <aside className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=70"
          alt="Mountain road at dusk"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/25 to-transparent" />
        <div className="absolute inset-x-12 bottom-14 text-primary-foreground">
          <h2 className="text-3xl leading-tight">
            Every road scored.
            <br />
            Every detour earned.
          </h2>
          <p className="mt-4 max-w-sm text-sm opacity-90">
            482,000 travellers mapping the routes that guidebooks never got to.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
            <p className="mt-8 text-center text-sm">
              <Link to="/dashboard" className="font-semibold text-primary hover:underline">
                Continue as guest
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-premium flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="#4285F4"
          d="M23 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h6.1a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.5-5 3.5-8.5z"
        />
        <path
          fill="#34A853"
          d="M12 23.5c3.1 0 5.7-1 7.5-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.8 1.1a6.7 6.7 0 0 1-6.3-4.6H1.9v3A11.5 11.5 0 0 0 12 23.5z"
        />
        <path
          fill="#FBBC05"
          d="M5.7 14.3a6.9 6.9 0 0 1 0-4.4v-3H1.9a11.5 11.5 0 0 0 0 10.4l3.8-3z"
        />
        <path
          fill="#EA4335"
          d="M12 5.3c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.9 6.9l3.8 3A6.7 6.7 0 0 1 12 5.3z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
