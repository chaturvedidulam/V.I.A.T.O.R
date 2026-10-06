import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Compass, Home, RotateCcw, SatelliteDish } from "lucide-react";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

/** 404 page */
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="float-card max-w-md p-10 text-center">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Compass className="h-7 w-7" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-2 text-3xl font-bold">You've wandered off the map</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This route doesn't exist. Let's get you back to somewhere with roads.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="transition-premium inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Home className="h-4 w-4" /> Go home
          </Link>
          <Link
            to="/explore"
            className="transition-premium inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-accent"
          >
            Open the map
          </Link>
        </div>
      </div>
    </div>
  );
}

/** 500 page */
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="float-card max-w-md p-10 text-center">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <SatelliteDish className="h-7 w-7" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Error 500
        </p>
        <h1 className="mt-2 text-3xl font-bold">We lost signal</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Something failed on our side. Retrying usually reconnects straight away.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="transition-premium inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <a
            href="/"
            className="transition-premium inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VIATOR — AI travel & navigation" },
      {
        name: "description",
        content: "Plan smarter routes, uncover hidden gems and travel with community intelligence.",
      },
      { property: "og:title", content: "VIATOR — AI travel & navigation" },
      {
        property: "og:description",
        content: "Plan smarter routes, uncover hidden gems and travel with community intelligence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-center" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
