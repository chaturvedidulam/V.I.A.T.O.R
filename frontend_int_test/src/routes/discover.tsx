import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutGrid, Map as MapIcon, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FilterChips } from "@/components/shared/filter-chips";
import { PlaceCard } from "@/components/shared/cards";
import { EmptyState, GridSkeleton, SectionHeader } from "@/components/shared/primitives";
import { MapCanvas } from "@/components/shared/map-canvas";
import { useAsync } from "@/hooks/use-async";
import { getNearbyPlaces } from "@/services/places";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover places — VIATOR" },
      { name: "description", content: "Browse places from the VIATOR POI collection." },
      { property: "og:title", content: "Discover places — VIATOR" },
      { property: "og:description", content: "Browse places from the VIATOR POI collection." },
    ],
  }),
  component: Discover,
});

const CATEGORIES = ["All", "Nature", "Food", "Culture", "Waterfall", "Wildlife", "Park", "Heritage", "Museum", "Religious", "Viewpoint"];

function usableImageUrl(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const image = images.find((value): value is string =>
    typeof value === "string" && value.trim().length > 0 &&
    /^(https?:\/\/|data:image\/)/i.test(value.trim()),
  );
  return image?.trim() ?? null;
}

function Discover() {
  const [category, setCategory] = useState<string[]>(["All"]);
  const [view, setView] = useState<"grid" | "map">("grid");
  const places = useAsync(() => getNearbyPlaces(), []);
  const active = category[0] ?? "All";
  const filteredPlaces = useMemo(() => (places.data ?? []).filter((place) => {
    if (active === "All") return true;
    const evidence = `${place.category} ${place.tags.join(" ")}`;
    if (active === "Food") return /food|cafe|restaurant/i.test(evidence);
    if (active === "Culture") return /heritage|museum|religious|culture/i.test(evidence);
    return evidence.toLowerCase().includes(active.toLowerCase());
  }), [active, places.data]);
  const { placesWithImages, placesWithoutImages } = useMemo(() => {
    const withImages: typeof filteredPlaces = [];
    const withoutImages: typeof filteredPlaces = [];
    for (const place of filteredPlaces) {
      const image = usableImageUrl(place.gallery);
      if (image) withImages.push({ ...place, image });
      else withoutImages.push(place);
    }
    return { placesWithImages: withImages, placesWithoutImages: withoutImages };
  }, [filteredPlaces]);

  return (
    <AppShell>
      <SectionHeader
        title="Discover places"
        subtitle="Places from the VIATOR POI collection; this list is not filtered by your current location."
        action={<div className="inline-flex shrink-0 gap-1 rounded-xl bg-muted p-1">
          {([ ["grid", LayoutGrid], ["map", MapIcon] ] as const).map(([key, Icon]) => (
            <button key={key} type="button" onClick={() => setView(key)} aria-label={`${key} view`}
              className={cn("transition-premium grid h-9 w-9 place-items-center rounded-lg", view === key ? "bg-card text-primary shadow-soft" : "text-muted-foreground")}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>}
      />
      <FilterChips options={CATEGORIES} value={category} onChange={(next) => setCategory(next.length ? next : ["All"])} multi={false} className="mt-6" />

      {places.loading ? <GridSkeleton className="mt-8" count={6} /> : places.error ? (
        <EmptyState className="mt-8" icon={MapPin} title="Places are unavailable" description={places.error.message || "The POI service could not be reached."} />
      ) : view === "map" ? (
        <div className="mt-8 h-[32rem] overflow-hidden rounded-3xl shadow-float"><MapCanvas places={filteredPlaces} className="h-full w-full" /></div>
      ) : filteredPlaces.length === 0 ? (
        <EmptyState className="mt-8" icon={MapPin} title="No places in this category" description="Try another category." />
      ) : (
        <div className="mt-8 space-y-10">
          {placesWithImages.length > 0 && (
            <section aria-labelledby="featured-places-heading">
              <h2 id="featured-places-heading" className="mb-4 text-xl font-bold">Featured Places</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {placesWithImages.map((place) => <PlaceCard key={place.id} place={place} />)}
              </div>
            </section>
          )}
          {placesWithoutImages.length > 0 && (
            <section aria-labelledby="more-places-heading">
              <h2 id="more-places-heading" className="mb-4 text-xl font-bold">More Places</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {placesWithoutImages.map((place) => <PlaceCard key={place.id} place={place} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}
