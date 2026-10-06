import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeader } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations — VIATOR" },
      { name: "description", content: "Personalized recommendations are coming soon to VIATOR." },
    ],
  }),
  component: Recommendations,
});

function Recommendations() {
  return (
    <AppShell>
      <section className="mx-auto max-w-2xl py-16 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground"><Sparkles className="h-6 w-6" /></span>
        <SectionHeader title="Personalized recommendations" subtitle="Coming soon" className="mt-6" />
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          VIATOR’s personalized recommendation model is under development. The V1 route planner already provides preference-based GIS recommendations using mapped POI evidence.
        </p>
        <Button asChild className="mt-6 rounded-xl"><Link to="/plan">Try route recommendations</Link></Button>
      </section>
    </AppShell>
  );
}
