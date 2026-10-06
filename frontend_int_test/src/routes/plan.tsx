import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Check, LocateFixed, MapPin, Route as RouteIcon, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RouteCard } from "@/components/shared/cards";
import { EmptyState, ListSkeleton, SectionHeader, Stepper } from "@/components/shared/primitives";
import { MapCanvas } from "@/components/shared/map-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import type { Place } from "@/data/mock";
import { getNearbyPlaces } from "@/services/places";
import {
  getRoutes,
  type RouteCoordinate,
  type RoutePlanResult,
  type RoutePreference,
} from "@/services/routes";
import { ApiError } from "@/services/client";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Route planner — VIATOR" },
      {
        name: "description",
        content: "Compare real road route candidates and choose the route that fits your preference.",
      },
    ],
  }),
  component: Planner,
});

const SUPPORTED_PREFERENCES: { value: RoutePreference; label: string }[] = [
  { value: "fastest", label: "Fastest" },
  { value: "scenic", label: "Scenic" },
  { value: "nature", label: "Nature" },
  { value: "food", label: "Food" },
  { value: "culture", label: "Culture" },
  { value: "hidden-gems", label: "Hidden gems" },
];

const UNAVAILABLE_PREFERENCES = ["Fewer tolls", "Avoid highways", "Low emission", "EV charging", "Accessible"];
const MAX_POI_SUGGESTIONS = 8;

function parseCoordinatePair(value: string): RouteCoordinate | null {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

async function resolveLocation(query: string): Promise<{ coordinate: RouteCoordinate; label: string }> {
  const typedCoordinate = parseCoordinatePair(query);
  if (typedCoordinate) return { coordinate: typedCoordinate, label: query.trim() };

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error("Location search is temporarily unavailable.");
  const matches = (await response.json()) as { lat: string; lon: string; display_name: string }[];
  const match = matches[0];
  if (!match) throw new Error("No matching location was found. Try a more specific place name.");
  const latitude = Number(match.lat);
  const longitude = Number(match.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("The location search returned invalid coordinates.");
  }
  return { coordinate: { latitude, longitude }, label: match.display_name };
}

function coordinateLabel(coordinate: RouteCoordinate) {
  return `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`;
}

function SearchablePoiPicker({
  id,
  value,
  placeholder,
  places,
  loading,
  disabled,
  onValueChange,
  onSelect,
}: {
  id: string;
  value: string;
  placeholder: string;
  places: Place[];
  loading: boolean;
  disabled: boolean;
  onValueChange: (value: string) => void;
  onSelect: (place: Place) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const query = value.trim().toLocaleLowerCase();
  const matches = query
    ? places.filter((place) =>
        [place.name, place.category, place.address ?? ""]
          .some((field) => field.toLocaleLowerCase().includes(query)),
      ).slice(0, MAX_POI_SUGGESTIONS)
    : [];
  const listboxId = `${id}-listbox`;
  const activeOption = matches[activeIndex];

  const select = (place: Place) => {
    onSelect(place);
    setOpen(false);
    setActiveIndex(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && activeOption ? `${listboxId}-option-${activeOption.id}` : undefined}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          className="rounded-xl pl-9"
          onFocus={() => {
            setOpen(true);
          }}
          onChange={(event) => {
            onValueChange(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => matches.length === 0 ? 0 : Math.min(index + 1, matches.length - 1));
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.max(index - 1, 0));
              return;
            }
            if (event.key === "Enter" && open && activeOption) {
              event.preventDefault();
              select(activeOption);
            }
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="z-[1100] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-1"
      >
        <div id={listboxId} role="listbox" aria-label={`${placeholder} results`} className="max-h-64 overflow-y-auto">
          {loading ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Loading VIATOR places…</p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              {query ? "No matching places" : "Type to search VIATOR places"}
            </p>
          ) : (
            matches.map((place, index) => (
              <button
                key={place.id}
                id={`${listboxId}-option-${place.id}`}
                type="button"
                role="option"
                aria-selected={place.name === value}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(place)}
                className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left outline-none ${index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{place.name}</span>
                  <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                    {[place.category, place.address].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {index === activeIndex && <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Planner() {
  const requestInFlight = useRef(false);
  const endpointResolutionInFlight = useRef(false);
  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [originCoordinate, setOriginCoordinate] = useState<RouteCoordinate | null>(null);
  const [destinationCoordinate, setDestinationCoordinate] = useState<RouteCoordinate | null>(null);
  const [selectionTarget, setSelectionTarget] = useState<"origin" | "destination" | null>(null);
  const [preference, setPreference] = useState<RoutePreference>("fastest");
  const [results, setResults] = useState<RoutePlanResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolvingTarget, setResolvingTarget] = useState<"origin" | "destination" | null>(null);
  const [error, setError] = useState("");
  const [requestFailed, setRequestFailed] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState("");
  const [originCustomMode, setOriginCustomMode] = useState(false);
  const [destinationCustomMode, setDestinationCustomMode] = useState(false);

  useEffect(() => {
    let active = true;
    getNearbyPlaces()
      .then((loadedPlaces) => {
        if (active) setPlaces(loadedPlaces);
      })
      .catch((loadError: unknown) => {
        if (active) setPlacesError(loadError instanceof Error ? loadError.message : "VIATOR places could not be loaded.");
      })
      .finally(() => {
        if (active) setPlacesLoading(false);
      });
    return () => { active = false; };
  }, []);

  const clearResults = () => {
    setResults(null);
    setSelectedRouteId(null);
    setError("");
    setRequestFailed(false);
  };

  const setEndpoint = (target: "origin" | "destination", coordinate: RouteCoordinate, label: string) => {
    if (target === "origin") {
      setOriginCoordinate(coordinate);
      setOriginText(label);
    } else {
      setDestinationCoordinate(coordinate);
      setDestinationText(label);
    }
    clearResults();
  };

  const handleMapCoordinateSelect = (coordinate: RouteCoordinate) => {
    if (!selectionTarget) return;
    setEndpoint(selectionTarget, coordinate, `Map point (${coordinateLabel(coordinate)})`);
    setSelectionTarget(null);
  };

  const locateCurrentOrigin = () => {
    if (requestInFlight.current || endpointResolutionInFlight.current) return;
    if (!navigator.geolocation) {
      setError("This browser does not support location access. Choose a point on the map or search for a place.");
      return;
    }
    endpointResolutionInFlight.current = true;
    setResolvingTarget("origin");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setEndpoint("origin", {
          latitude: coords.latitude,
          longitude: coords.longitude,
        }, "Current location");
        endpointResolutionInFlight.current = false;
        setResolvingTarget(null);
      },
      (locationError) => {
        setError(locationError.code === locationError.PERMISSION_DENIED
          ? "Location permission was denied. Choose a point on the map or search for a place."
          : "Your current location could not be determined. Choose a point on the map or search for a place.");
        endpointResolutionInFlight.current = false;
        setResolvingTarget(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const searchEndpoint = async (target: "origin" | "destination") => {
    if (requestInFlight.current || endpointResolutionInFlight.current) return;
    const text = target === "origin" ? originText : destinationText;
    if (!text.trim()) {
      setError(`Enter a ${target} place name or coordinate first.`);
      return;
    }
    endpointResolutionInFlight.current = true;
    setResolvingTarget(target);
    setError("");
    try {
      const resolved = await resolveLocation(text.trim());
      setEndpoint(target, resolved.coordinate, resolved.label);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Location search failed. Please try again.");
    } finally {
      endpointResolutionInFlight.current = false;
      setResolvingTarget(null);
    }
  };

  const search = async () => {
    if (requestInFlight.current || endpointResolutionInFlight.current) return;
    if (!originCoordinate) {
      setError("Set an origin by searching for a place, using your location, or clicking the map.");
      return;
    }
    if (!destinationCoordinate) {
      setError("Set a destination by searching for a place or clicking the map.");
      return;
    }

    setError("");
    requestInFlight.current = true;
    setLoading(true);
    setResults(null);
    setSelectedRouteId(null);
    setSelectionTarget(null);
    setRequestFailed(false);
    try {
      const data = await getRoutes({
        origin: originCoordinate,
        destination: destinationCoordinate,
        preference,
      });
      setResults(data);
      const recommended = data.candidates.find((candidate) => candidate.candidateId === data.recommendedCandidateId);
      setSelectedRouteId(recommended?.candidateId ?? data.candidates[0]?.candidateId ?? null);
    } catch (requestError) {
      setRequestFailed(true);
      setError(requestError instanceof ApiError
        ? requestError.message
        : requestError instanceof Error
          ? requestError.message
          : "We couldn't plan this route. Please try again.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  };

  const step = results || loading ? 1 : 0;
  const selectedRoute = results?.candidates.find((candidate) => candidate.candidateId === selectedRouteId);

  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl sm:text-3xl">Route planner</h1>
          <p className="mt-1 text-sm text-muted-foreground">Compare real road routes for the preference you choose.</p>
        </div>
        <Stepper steps={["Set up", "Compare", "Go"]} current={step} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[26rem_minmax(0,1fr)]">
        <section className="float-card h-fit p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="origin">From</Label>
              <div className="flex gap-2">
                {!originCustomMode ? (
                  <div className="relative min-w-0 flex-1">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <SearchablePoiPicker
                      id="origin"
                      value={originText}
                      placeholder="Search starting place"
                      places={places}
                      loading={placesLoading}
                      disabled={loading || resolvingTarget !== null}
                      onValueChange={(value) => {
                        setOriginText(value);
                        setOriginCoordinate(null);
                        clearResults();
                      }}
                      onSelect={(place) => setEndpoint("origin", { latitude: place.coords.lat, longitude: place.coords.lng }, place.name)}
                    />
                  </div>
                ) : (
                  <div className="relative min-w-0 flex-1">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="origin"
                      disabled={loading || resolvingTarget !== null}
                      value={originText}
                      onChange={(event) => {
                        setOriginText(event.target.value);
                        setOriginCoordinate(null);
                        clearResults();
                      }}
                      onKeyDown={(event) => { if (event.key === "Enter") void searchEndpoint("origin"); }}
                      placeholder="Enter address or lat, lon"
                      className="rounded-xl pl-9"
                    />
                  </div>
                )}
                {originCustomMode && <Button type="button" variant="outline" size="icon" aria-label="Resolve custom origin" title="Resolve custom origin" disabled={loading || resolvingTarget !== null} onClick={() => void searchEndpoint("origin")}><Search /></Button>}
                <Button type="button" variant="outline" size="icon" aria-label="Use current location" title="Use current location" disabled={loading || resolvingTarget !== null} onClick={locateCurrentOrigin}>
                  <LocateFixed />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <button type="button" className="text-xs text-primary underline-offset-2 hover:underline" onClick={() => setOriginCustomMode((mode) => !mode)}>
                  {originCustomMode ? "Search VIATOR places" : "Use a custom location or coordinates"}
                </button>
              </div>
              <Button type="button" variant={selectionTarget === "origin" ? "secondary" : "ghost"} size="sm" disabled={loading || resolvingTarget !== null} onClick={() => setSelectionTarget(selectionTarget === "origin" ? null : "origin")}>
                Pick origin on map
              </Button>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                aria-label="Swap origin and destination"
                disabled={loading || resolvingTarget !== null}
                onClick={() => {
                  setOriginText(destinationText);
                  setDestinationText(originText);
                  setOriginCoordinate(destinationCoordinate);
                  setDestinationCoordinate(originCoordinate);
                  setOriginCustomMode(destinationCustomMode);
                  setDestinationCustomMode(originCustomMode);
                  clearResults();
                }}
                className="transition-premium grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground hover:bg-accent"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">To</Label>
              <div className="flex gap-2">
                {!destinationCustomMode ? (
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <SearchablePoiPicker
                      id="destination"
                      value={destinationText}
                      placeholder="Search destination"
                      places={places}
                      loading={placesLoading}
                      disabled={loading || resolvingTarget !== null}
                      onValueChange={(value) => {
                        setDestinationText(value);
                        setDestinationCoordinate(null);
                        clearResults();
                      }}
                      onSelect={(place) => setEndpoint("destination", { latitude: place.coords.lat, longitude: place.coords.lng }, place.name)}
                    />
                  </div>
                ) : (
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="destination"
                      disabled={loading || resolvingTarget !== null}
                      value={destinationText}
                      onChange={(event) => {
                        setDestinationText(event.target.value);
                        setDestinationCoordinate(null);
                        clearResults();
                      }}
                      onKeyDown={(event) => { if (event.key === "Enter") void searchEndpoint("destination"); }}
                      placeholder="Enter address or lat, lon"
                      className="rounded-xl pl-9"
                    />
                  </div>
                )}
                {destinationCustomMode && <Button type="button" variant="outline" size="icon" aria-label="Resolve custom destination" title="Resolve custom destination" disabled={loading || resolvingTarget !== null} onClick={() => void searchEndpoint("destination")}><Search /></Button>}
              </div>
              <Button type="button" variant={selectionTarget === "destination" ? "secondary" : "ghost"} size="sm" disabled={loading || resolvingTarget !== null} onClick={() => setSelectionTarget(selectionTarget === "destination" ? null : "destination")}>
                Pick destination on map
              </Button>
            </div>

            {placesError && <p role="status" className="text-xs text-destructive">Place list unavailable. Use a custom location or pick on map.</p>}

            <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              <p>Origin coordinates: {originCoordinate ? coordinateLabel(originCoordinate) : "Not set"}</p>
              <p className="mt-1">Destination coordinates: {destinationCoordinate ? coordinateLabel(destinationCoordinate) : "Not set"}</p>
            </div>

            <div className="space-y-2">
              <Label>Mode</Label>
              <p className="rounded-xl bg-muted px-3 py-2 text-sm">Driving route (OSRM)</p>
            </div>

            <div className="space-y-2">
              <Label>Preference</Label>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_PREFERENCES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={loading || resolvingTarget !== null}
                    aria-pressed={preference === option.value}
                    onClick={() => { setPreference(option.value); clearResults(); }}
                    className={`transition-premium shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${preference === option.value
                      ? "border-primary bg-primary text-primary-foreground shadow-soft"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"}`}
                  >
                    {option.label}
                  </button>
                ))}
                {UNAVAILABLE_PREFERENCES.map((option) => (
                  <span key={option} title="This preference is not supported by route planning yet" className="rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted-foreground opacity-60">
                    {option} · coming soon
                  </span>
                ))}
              </div>
            </div>

            {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
            <Button className="w-full rounded-xl" onClick={() => void search()} disabled={loading || resolvingTarget !== null}>
              <RouteIcon className="h-4 w-4" /> {loading ? "Planning routes…" : "Find routes"}
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="h-[26rem] overflow-hidden rounded-3xl shadow-float">
            <MapCanvas
              routeCandidates={results?.candidates ?? []}
              selectedRouteId={selectedRouteId}
              originCoordinate={originCoordinate}
              destinationCoordinate={destinationCoordinate}
              routeSelectionTarget={selectionTarget}
              {...(selectionTarget && !loading && resolvingTarget === null
                ? { onMapCoordinateSelect: handleMapCoordinateSelect }
                : {})}
              className="h-full w-full"
            />
          </div>

          {loading ? (
            <ListSkeleton count={3} />
          ) : requestFailed ? (
            <EmptyState icon={RouteIcon} title="Route planning failed" description={error || "We couldn't load routes. Please try again."} />
          ) : results === null ? (
            <EmptyState
              icon={RouteIcon}
              title="Choose your route endpoints"
              description="Search for places, enter coordinates, or select points on the map. Route planning starts after both endpoints are set."
            />
          ) : results.candidates.length === 0 ? (
            <EmptyState
              icon={RouteIcon}
              title={error ? "Routes could not be loaded" : "No routes found"}
              description={error || "The route service did not return any candidates. Try another endpoint or preference."}
            />
          ) : (
            <>
              <SectionHeader
                title={`${results.candidates.length} real route${results.candidates.length === 1 ? "" : "s"}`}
                subtitle={`${originText} → ${destinationText}`}
              />
              {!results.preferenceSupported && (
                <p className="rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                  The selected preference has no supporting route data. The backend recommends the fastest candidate as a fallback.
                </p>
              )}
              {selectedRoute && <p className="text-xs text-muted-foreground">Map highlights {selectedRoute.candidateId}; select any route below to compare its geometry.</p>}
              <div className="space-y-5">
                {results.candidates.map((candidate) => (
                  <RouteCard
                    key={candidate.candidateId}
                    route={candidate}
                    preference={results.preference}
                    preferenceSupported={results.preferenceSupported}
                    selected={candidate.candidateId === selectedRouteId}
                    onSelect={() => setSelectedRouteId(candidate.candidateId)}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
