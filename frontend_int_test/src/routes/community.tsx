import { createFileRoute, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — VIATOR" },
      { name: "description", content: "VIATOR community features are coming soon." },
    ],
  }),
  component: Community,
});

function Community() {
  return (
    <AppShell>
      <section className="mx-auto max-w-2xl py-16 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground"><Users className="h-6 w-6" /></span>
        <h1 className="mt-6 text-2xl font-bold sm:text-3xl">Community — Coming Soon</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Community posts and traveller interactions are not available in V1 yet. You can explore real places, save them, and read or write place reviews.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild className="rounded-xl"><Link to="/explore">Explore places</Link></Button>
          <Button asChild variant="outline" className="rounded-xl"><Link to="/plan">Plan a route</Link></Button>
        </div>
      </section>
    </AppShell>
  );
}
