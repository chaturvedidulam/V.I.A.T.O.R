import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Route as RouteIcon } from "lucide-react";
import { Navbar } from "@/components/layout/app-shell";
import { FloatingSearch } from "@/components/shared/floating-search";
import { FilterChips } from "@/components/shared/filter-chips";
import { MapCanvas } from "@/components/shared/map-canvas";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { StarRating } from "@/components/shared/star-rating";
import { PhotoAttribution } from "@/components/shared/photo-attribution";
import { EmptyState } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/use-async";
import { getNearbyPlaces } from "@/services/places";
import { getReviews } from "@/services/reviews";
import type { Place } from "@/data/mock";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore places — VIATOR" },
      { name: "description", content: "Explore places from the VIATOR POI collection on a map." },
      { property: "og:title", content: "Explore places — VIATOR" },
      { property: "og:description", content: "Explore places from the VIATOR POI collection on a map." },
    ],
  }),
  component: Explore,
});

const FILTERS = ["All", "Nature", "Food", "Culture", "Waterfall", "Wildlife", "Park", "Heritage", "Museum", "Religious"];

function Explore() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<string[]>(["All"]);
  const [active, setActive] = useState<Place | null>(null);
  const places = useAsync(() => getNearbyPlaces(), []);
  const reviews = useAsync(() => active ? getReviews(active.id) : Promise.resolve([]), [active?.id]);
  const filtersRef = useRef<HTMLDivElement>(null);

  const visiblePlaces = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (places.data ?? []).filter((place) => {
      const haystack = [place.name, place.city, place.country, place.category, ...place.tags].join(" ").toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesFilters = filters.includes("All") || filters.every((filter) => {
        if (filter === "Food") return /food|cafe|restaurant/i.test(haystack);
        if (filter === "Culture") return /heritage|museum|religious|culture/i.test(haystack);
        return haystack.includes(filter.toLowerCase());
      });
      return matchesSearch && matchesFilters;
    });
  }, [filters, places.data, query]);

  useEffect(() => {
    if (active && !visiblePlaces.some((place) => place.id === active.id)) setActive(null);
  }, [active, visiblePlaces]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navbar />
      <div className="relative min-h-0 flex-1">
        {places.loading ? <Skeleton className="h-full w-full rounded-none" /> : visiblePlaces.length === 0 ? (
          <div className="grid h-full place-items-center p-6">
            <EmptyState icon={MapPin} title={places.error ? "Places are unavailable" : "No places match"}
              description={places.error?.message ?? "Try another search or clear the filters."} />
          </div>
        ) : (
          <MapCanvas places={visiblePlaces} activeId={active?.id ?? null} onSelect={setActive} className="h-full w-full" />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-4 z-30 px-4">
          <div className="pointer-events-auto mx-auto max-w-3xl space-y-3">
            <FloatingSearch value={query} onChange={setQuery} placeholder="Search places" onFilter={() => filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })} />
            <div ref={filtersRef}><FilterChips options={FILTERS} value={filters} onChange={(next) => setFilters(next.length ? next : ["All"])} multi={false} /></div>
          </div>
        </div>

        <div className="absolute bottom-6 left-4 z-30 flex flex-col gap-3 lg:bottom-6">
          <Button asChild variant="secondary" size="lg" className="rounded-2xl shadow-lift">
            <Link to="/plan"><RouteIcon className="h-4 w-4" /> Plan route</Link>
          </Button>
        </div>

        <BottomSheet open={!!active} onClose={() => setActive(null)} title={active?.name ?? "Details"}>
          {active && (
            <div className="space-y-5">
              {active.image ? <><img src={active.image} alt={active.name} className="h-40 w-full rounded-2xl object-cover" /><PhotoAttribution poiId={active.id} imageUrl={active.image} /></> :
                <div className="grid h-40 place-items-center rounded-2xl bg-muted text-sm text-muted-foreground">No image available</div>}
              <div>
                <h2 className="text-xl font-bold">{active.name}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {active.city}, {active.country} · {active.category}</p>
                {active.reviewCount > 0 ? <StarRating value={active.rating} count={active.reviewCount} className="mt-2" /> : <p className="mt-2 text-sm text-muted-foreground">No ratings yet</p>}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{active.summary}</p>
              <div>
                <h3 className="text-sm font-bold">Reviews</h3>
                {reviews.loading ? <div className="mt-3 space-y-2"><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="h-14 w-full rounded-xl" /></div> :
                  reviews.error ? <p className="mt-3 text-sm text-destructive">{reviews.error.message || "Unable to load reviews."}</p> :
                    (reviews.data ?? []).length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No reviews for this place yet.</p> :
                      <div className="mt-3 space-y-3">{(reviews.data ?? []).slice(0, 2).map((review) => (
                        <div key={review.id} className="rounded-xl border border-border p-3">
                          <div className="flex items-center gap-2"><p className="text-xs font-bold">Traveler</p><StarRating value={review.rating} size={11} className="ml-auto shrink-0" /></div>
                          <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{review.text}</p>
                        </div>
                      ))}</div>}
              </div>
              <div className="pb-2">
                <Button asChild variant="outline" className="rounded-xl"><Link to="/place/$id" params={{ id: active.id }}>Place details</Link></Button>
              </div>
            </div>
          )}
        </BottomSheet>
      </div>
    </div>
  );
}
