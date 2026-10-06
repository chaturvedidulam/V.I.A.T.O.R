import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Compass, MapPin, Navigation, Plus, Route as RouteIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FloatingSearch } from "@/components/shared/floating-search";
import { MapCanvas } from "@/components/shared/map-canvas";
import { PlaceCard } from "@/components/shared/cards";
import { CardSkeleton, EmptyState, SectionHeader } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/use-async";
import { getNearbyPlaces } from "@/services/places";
import { getUserProfile } from "@/services/user";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — VIATOR" },
      { name: "description", content: "Explore real places and plan a route with VIATOR." },
      { property: "og:title", content: "Dashboard — VIATOR" },
      { property: "og:description", content: "Explore places and plan a route with VIATOR." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [query, setQuery] = useState("");
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const profile = useAsync(() => getUserProfile(), []);
  const places = useAsync(() => getNearbyPlaces(), []);
  const search = query.trim().toLowerCase();
  const filteredPlaces = (places.data ?? []).filter((place) =>
    !search || [place.name, place.city, place.country, place.category, ...place.tags]
      .join(" ").toLowerCase().includes(search),
  );

  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl sm:text-3xl">
            {profile.data?.name ? `Welcome, ${profile.data.name}` : "Your VIATOR dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.error ? "Profile details are unavailable right now." : "Explore places in the VIATOR POI collection."}
          </p>
        </div>
        <Button asChild className="shrink-0 rounded-xl">
          <Link to="/plan"><Plus className="h-4 w-4" /> Plan a route</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="relative h-[24rem] overflow-hidden rounded-3xl shadow-float lg:h-[32rem]">
          <MapCanvas
            places={filteredPlaces}
            searchQuery={query}
            recenterTrigger={recenterTrigger}
            className="h-full w-full"
          />
          <div className="absolute inset-x-4 top-4 z-30 max-w-md">
            <FloatingSearch value={query} onChange={setQuery} placeholder="Search places" showFilter={false} />
          </div>
          <div className="absolute bottom-4 left-4 z-30 flex flex-wrap gap-2">
            <Button asChild className="rounded-xl shadow-float">
              <Link to="/explore"><Compass className="h-4 w-4" /> Explore places</Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl shadow-float"
              onClick={() => setRecenterTrigger((current) => current + 1)}
            >
              <Navigation className="h-4 w-4" /> Recenter map
            </Button>
          </div>
        </div>

        <section className="float-card h-fit p-5">
          <SectionHeader title="Plan a road trip" subtitle="Compare real driving routes by preference." />
          <Button asChild variant="outline" className="mt-4 w-full rounded-xl">
            <Link to="/plan"><RouteIcon className="h-4 w-4" /> Open route planner</Link>
          </Button>
          <p className="mt-5 text-sm text-muted-foreground">
            The route planner uses mapped POI evidence and real road candidates where available.
          </p>
        </section>
      </div>

      <section className="mt-14">
        <SectionHeader
          title="Explore places"
          subtitle="Places returned by the VIATOR POI service. This collection is not filtered by your current location."
          action={<Button asChild variant="ghost" className="rounded-xl"><Link to="/explore">View map</Link></Button>}
        />
        {places.loading ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} />)}
          </div>
        ) : places.error ? (
          <EmptyState className="mt-6" icon={MapPin} title="Places are unavailable" description="The POI service could not be reached. Try again later." />
        ) : filteredPlaces.length === 0 ? (
          <EmptyState className="mt-6" icon={MapPin} title="No places found" description={`No places match “${query}”. Try another search.`} />
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredPlaces.slice(0, 4).map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
        )}
      </section>
    </AppShell>
  );
}
