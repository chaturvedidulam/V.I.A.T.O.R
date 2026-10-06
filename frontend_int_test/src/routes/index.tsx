import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPinned, Route as RouteIcon, Star } from "lucide-react";
import { Navbar, Footer } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VIATOR — Plan a better road trip" },
      { name: "description", content: "Compare road routes and explore mapped places with VIATOR." },
      { property: "og:title", content: "VIATOR — Plan a better road trip" },
      { property: "og:description", content: "Compare road routes and explore mapped places with VIATOR." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: RouteIcon,
    title: "Compare road routes",
    body: "Choose a supported preference and compare real road candidates with distance, duration, detour, and mapped POI evidence.",
  },
  {
    icon: MapPinned,
    title: "Explore mapped places",
    body: "Browse the VIATOR POI collection on a map and open place details.",
  },
  {
    icon: Star,
    title: "Save places and review them",
    body: "Sign in to save places and read or write reviews where available.",
  },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=70" alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-background/80 dark:bg-background/85" />
          </div>
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="max-w-4xl">
              <span className="inline-flex rounded-full border border-border/60 bg-card/90 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-foreground shadow-soft backdrop-blur">Road trip planning with mapped POI evidence</span>
              <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">Plan smarter.<br /><span className="text-primary">Travel deeper.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Compare real driving routes by preference, inspect the places mapped along them, and keep track of places you save and review.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-xl px-6"><Link to="/plan">Plan my journey <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl bg-background/70 backdrop-blur"><Link to="/explore">Explore places</Link></Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold sm:text-3xl">Plan and explore with VIATOR</h2>
              <p className="mt-2 text-sm text-muted-foreground">Available V1 features use route, POI, review, and save data.</p>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <article key={title} className="float-card p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-3xl border border-border/60 bg-card/70 p-8 shadow-soft sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to plan your route?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Choose your start, destination, and a supported preference to compare the available candidates.</p>
            <Button asChild className="mt-6 rounded-xl"><Link to="/plan">Open route planner <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
