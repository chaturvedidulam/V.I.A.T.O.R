import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  Clock,
  MapPin,
  Navigation,
  Route as RouteIcon,
  ThumbsUp,
} from "lucide-react";
import type { Business, Place, Post, Review } from "@/data/mock";
import type { RouteCandidate, RoutePreference } from "@/services/routes";
import { StarRating } from "./star-rating";
import { GemBadge, VerifiedBadge } from "./badges";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PhotoAttribution } from "./photo-attribution";

export function PlaceCard({
  place,
  className,
  reason,
}: {
  place: Place;
  className?: string;
  reason?: string;
}) {
  return (
    <article className={cn("float-card transition-premium group overflow-hidden hover:-translate-y-1 hover:shadow-lift", className)}>
      <Link to="/place/$id" params={{ id: place.id }} className="block">
        <div className="relative h-44 overflow-hidden">
          {place.image ? (
            <img
              src={place.image}
              alt={place.name}
              loading="lazy"
              className="transition-premium h-full w-full object-cover group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center bg-muted text-xs text-muted-foreground">No image available</div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            {place.hiddenGem && <GemBadge />}
            {place.verified && !place.hiddenGem && <VerifiedBadge />}
          </div>
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 truncate text-base font-bold">{place.name}</h3>
            {place.distanceKm > 0 && <span className="shrink-0 text-xs font-semibold text-muted-foreground">{place.distanceKm} km</span>}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {place.city}, {place.country} · {place.category}
            </span>
          </div>
          <StarRating value={place.rating} count={place.reviewCount} />
          {reason && <p className="pt-1 text-xs font-medium text-accent-foreground">{reason}</p>}
        </div>
      </Link>
      {place.image && <div className="px-4 pb-4"><PhotoAttribution poiId={place.id} imageUrl={place.image} /></div>}
    </article>
  );
}

export function RouteCard({
  route,
  preference,
  preferenceSupported,
  selected,
  onSelect,
  className,
}: {
  route: RouteCandidate;
  preference: RoutePreference;
  preferenceSupported: boolean;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  const durationMinutes = Math.round(route.durationSeconds / 60);
  const durationLabel = durationMinutes >= 60
    ? `${Math.floor(durationMinutes / 60)} h ${durationMinutes % 60} min`
    : `${durationMinutes} min`;
  const evidenceCounts = route.scoreBreakdown.categoryEvidenceCounts ?? route.evidence.categoryCounts;
  const count = (key: string) => evidenceCounts[key] ?? 0;
  const evidenceRows: [string, number][] = preference === "nature"
    ? [["Wildlife", count("wildlife")], ["Waterfalls", count("waterfall")], ["Parks", count("park")], ["Nature POIs", count("nature")]]
    : preference === "food"
      ? [
          ["Food POIs", count("food")],
          ["Restaurants", route.nearbyPois.filter((poi) => poi.tags.some((tag) => /restaurant/i.test(tag))).length],
          ["Cafes", route.nearbyPois.filter((poi) => poi.tags.some((tag) => /(^|:)cafe($|:)/i.test(tag))).length],
        ]
      : preference === "culture"
        ? [["Heritage", count("heritage")], ["Museums", count("museum")], ["Religious places", count("religious")]]
        : preference === "scenic"
          ? [["Nature", count("nature")], ["Waterfalls", count("waterfall")], ["Viewpoints", count("viewpoint")], ["Beaches", count("beach")], ["Wildlife", count("wildlife")], ["Parks", count("park")]]
          : preference === "hidden-gems"
            ? [["Tagged hidden gems", count("hiddenGem")]]
            : [];
  const visibleEvidence = evidenceRows.filter(([, value]) => value > 0);
  const seenPlaceNames = new Set<string>();
  const nearbyPlaces = [...route.nearbyPois]
    .sort((a, b) => a.distanceFromRouteMeters - b.distanceFromRouteMeters || a.name.localeCompare(b.name))
    .filter((poi) => {
      const key = poi.name.trim().toLocaleLowerCase();
      if (!key || seenPlaceNames.has(key)) return false;
      seenPlaceNames.add(key);
      return true;
    })
    .slice(0, 7);
  const contributions = Object.entries(route.scoreBreakdown)
    .filter((entry): entry is [string, number] =>
      entry[0].endsWith("Contribution") && typeof entry[1] === "number");
  return (
    <article className={cn(
      "float-card transition-premium p-5",
      selected ? "ring-2 ring-primary" : "hover:shadow-lift",
      className,
    )}>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Navigation className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold">Route {route.candidateId}</h3>
            {route.recommended && (
              <p className="text-xs font-semibold text-primary">
                {preferenceSupported
                  ? `Recommended for ${preference === "hidden-gems" ? "Hidden Gems" : preference[0]!.toUpperCase() + preference.slice(1)}`
                  : "Recommended fastest fallback"}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold">{durationLabel}</p>
          <p className="text-xs text-muted-foreground">{(route.distanceMeters / 1000).toFixed(1)} km</p>
        </div>
      </header>

      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Why</p>
        <p className="mt-1 text-sm text-muted-foreground">{route.recommendationReason}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {(route.distanceMeters / 1000).toFixed(1)} km</span>
        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {durationLabel}</span>
        {route.detourFromFastestDurationPercent !== undefined && route.detourFromFastestDurationPercent > 0 && (
          <span>+{route.detourFromFastestDurationPercent.toFixed(1)}% vs fastest</span>
        )}
        {route.score !== null && <span>Route score {route.score.toFixed(2)}</span>}
      </div>

      {visibleEvidence.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{preference === "scenic" ? "Mapped evidence" : "Coverage"}</p>
          <p className="mt-1 text-sm text-foreground">{visibleEvidence.map(([label, value]) => `${value} ${label}`).join(" · ")}</p>
        </div>
      )}

      {preference === "hidden-gems" && visibleEvidence.length === 0 && !preferenceSupported && (
        <p className="mt-3 text-xs text-muted-foreground">No explicit hidden-gem tags were returned; this route is the fastest fallback.</p>
      )}

      {contributions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {contributions.map(([key, value]) => (
            <span key={key} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
              {key.replace(/Contribution$/, "").replace(/([A-Z])/g, " $1")}: {value.toFixed(3)}
            </span>
          ))}
        </div>
      )}

      <section className={cn(
        "mt-4 rounded-xl p-3",
        selected ? "border border-primary/25 bg-primary/5" : "bg-muted/50",
      )} aria-label="Places near this route">
        <h4 className={cn("text-xs font-bold", selected ? "text-primary" : "text-foreground")}>
          Places near this route
        </h4>
        {nearbyPlaces.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {nearbyPlaces.map((poi) => (
              <li key={poi.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
                <span className="font-medium">{poi.name}</span>
                <span className="text-xs text-muted-foreground">
                  {poi.category ? `${poi.category} · ` : ""}{Math.round(poi.distanceFromRouteMeters)} m from route
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">No mapped places along this route.</p>
        )}
      </section>

      <Button
        type="button"
        variant={selected ? "default" : "outline"}
        className="mt-5 w-full rounded-xl"
        aria-pressed={selected}
        onClick={onSelect}
      >
        {selected ? "Selected route" : "Select this route"}
      </Button>
    </article>
  );
}

export function BusinessCard({ business, className }: { business: Business; className?: string }) {
  return (
    <article
      className={cn(
        "float-card transition-premium group overflow-hidden hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={business.image}
          alt={business.name}
          loading="lazy"
          className="transition-premium h-full w-full object-cover group-hover:scale-105"
        />
        {business.offer && (
          <span className="absolute left-3 top-3 rounded-full bg-warning px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-warning-foreground">
            {business.offer}
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-base font-bold">{business.name}</h3>
          <span
            className={cn(
              "shrink-0 text-xs font-bold",
              business.openNow ? "text-success" : "text-muted-foreground",
            )}
          >
            {business.openNow ? "Open" : "Closed"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {business.category} · {business.distanceKm} km away
        </p>
        <StarRating value={business.rating} count={business.reviewCount} />
      </div>
    </article>
  );
}

export function ReviewCard({ review, className }: { review: Review; className?: string }) {
  return (
    <article className={cn("float-card p-5", className)}>
      <header className="flex items-center gap-3">
        <img src={review.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{review.author}</p>
          <p className="text-xs text-muted-foreground">{review.date}</p>
        </div>
        <StarRating value={review.rating} className="ml-auto shrink-0" />
      </header>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
      <button className="transition-premium mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary">
        <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({review.helpful})
      </button>
    </article>
  );
}

export function ProfileCard({
  name,
  handle,
  avatar,
  points,
  places,
  rank,
  className,
}: {
  name: string;
  handle: string;
  avatar: string;
  points?: number;
  places?: number;
  rank?: number;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-card p-3",
        className,
      )}
    >
      {rank !== undefined && (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold">
          {rank}
        </span>
      )}
      <img src={avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          @{handle}
          {places !== undefined && ` · ${places} places`}
        </p>
      </div>
      {points !== undefined && (
        <span className="shrink-0 text-xs font-bold text-primary">{points.toLocaleString()}</span>
      )}
    </article>
  );
}

const POST_TAGS: Record<Post["tag"], { label: string; className: string }> = {
  "hidden-gem": { label: "Hidden gem", className: "bg-warning text-warning-foreground" },
  "road-alert": { label: "Road alert", className: "bg-destructive text-destructive-foreground" },
  story: { label: "Travel story", className: "bg-primary text-primary-foreground" },
  photo: { label: "Photo", className: "bg-muted text-muted-foreground" },
};

export function PostCard({
  post,
  liked,
  bookmarked,
  onLike,
  onBookmark,
  className,
}: {
  post: Post;
  liked?: boolean;
  bookmarked?: boolean;
  onLike?: () => void;
  onBookmark?: () => void;
  className?: string;
}) {
  const tag = POST_TAGS[post.tag];
  return (
    <article className={cn("float-card overflow-hidden", className)}>
      <header className="flex items-center gap-3 p-4">
        <img
          src={post.author.avatar}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-bold">
            {post.author.name}
            {post.author.verified && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
            )}
          </p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" /> {post.location}
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 rounded-full text-xs">
          Follow
        </Button>
      </header>
      <img
        src={post.image}
        alt={post.caption}
        loading="lazy"
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
              tag.className,
            )}
          >
            {tag.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {post.postedAt}
          </span>
        </div>
        <p className="text-sm leading-relaxed">{post.caption}</p>
        <div className="flex items-center gap-4 pt-1 text-xs font-semibold text-muted-foreground">
          <button
            onClick={onLike}
            className={cn("transition-premium hover:text-destructive", liked && "text-destructive")}
          >
            ♥ {(post.likes + (liked ? 1 : 0)).toLocaleString()}
          </button>
          <button className="transition-premium hover:text-foreground">💬 {post.comments}</button>
          <button
            onClick={onBookmark}
            className={cn(
              "transition-premium ml-auto hover:text-primary",
              bookmarked && "text-primary",
            )}
            aria-label="Bookmark post"
          >
            <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function TripCard({
  trip,
  className,
}: {
  trip: { id: string; name: string; stops: number; distanceKm: number; image: string };
  className?: string;
}) {
  return (
    <article
      className={cn(
        "float-card transition-premium group overflow-hidden hover:-translate-y-1",
        className,
      )}
    >
      <img src={trip.image} alt={trip.name} loading="lazy" className="h-28 w-full object-cover" />
      <div className="p-4">
        <h3 className="truncate text-sm font-bold">{trip.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <RouteIcon className="h-3.5 w-3.5" /> {trip.stops} stops · {trip.distanceKm} km
        </p>
      </div>
    </article>
  );
}
