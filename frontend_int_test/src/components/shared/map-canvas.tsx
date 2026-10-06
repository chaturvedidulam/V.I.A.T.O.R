import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Compass, Layers, LocateFixed, Minus, Plus } from "lucide-react";

import type { Place } from "@/data/mock";
import type { RouteCandidate, RouteCoordinate } from "@/services/routes";
import { cn } from "@/lib/utils";

import "leaflet/dist/leaflet.css";

type LeafletMap = {
  flyTo: (center: [number, number], zoom: number, options?: object) => void;
  setView: (center: [number, number], zoom: number, options?: object) => void;
  fitBounds: (
    bounds: [number, number][],
    options?: { padding: [number, number]; maxZoom: number; animate: boolean },
  ) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  on: (event: "click", handler: (event: { latlng: { lat: number; lng: number } }) => void) => void;
  off: (event: "click", handler: (event: { latlng: { lat: number; lng: number } }) => void) => void;
};

type LeafletComponents = {
  MapContainer: ComponentType<Record<string, unknown>>;
  Marker: ComponentType<Record<string, unknown>>;
  Popup: ComponentType<Record<string, unknown>>;
  Tooltip: ComponentType<Record<string, unknown>>;
  Polyline: ComponentType<Record<string, unknown>>;
  TileLayer: ComponentType<Record<string, unknown>>;
  icon: (options: {
    iconUrl: string;
    iconRetinaUrl: string;
    shadowUrl: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
    popupAnchor: [number, number];
    shadowSize: [number, number];
  }) => unknown;
};

const EMPTY_MAP_CENTER: [number, number] = [0, 0];
const DEFAULT_ZOOM = 2;
const PLACE_ZOOM = 12;
const USER_LOCATION_ZOOM = 13;
const SEARCH_AREA_ZOOM = 13;
const SEARCH_RADIUS_ZOOM = 13;

export function MapCanvas({
  places = [],
  activeId,
  searchQuery = "",
  recenterTrigger = 0,
  onSelect,
  routeCandidates = [],
  selectedRouteId,
  originCoordinate,
  destinationCoordinate,
  routeSelectionTarget = null,
  onMapCoordinateSelect,
  className,
  children,
}: {
  places?: Place[];
  activeId?: string | null;
  searchQuery?: string;
  recenterTrigger?: number;
  onSelect?: (place: Place) => void;
  routeCandidates?: RouteCandidate[];
  selectedRouteId?: string | null;
  originCoordinate?: RouteCoordinate | null;
  destinationCoordinate?: RouteCoordinate | null;
  routeSelectionTarget?: "origin" | "destination" | null;
  onMapCoordinateSelect?: (coordinate: RouteCoordinate) => void;
  className?: string;
  children?: React.ReactNode;
}) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [leaflet, setLeaflet] = useState<LeafletComponents | null>(null);
  const [mapLayer, setMapLayer] = useState<"street" | "hot">("street");
  const firstPlace = places.at(0);
  const initialCenter: [number, number] = originCoordinate
    ? [originCoordinate.latitude, originCoordinate.longitude]
    : firstPlace
    ? [firstPlace.coords.lat, firstPlace.coords.lng]
    : EMPTY_MAP_CENTER;

  useEffect(() => {
    let active = true;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(
      ([reactLeaflet, leafletModule]) => {
        if (!active) return;
        setLeaflet({
          ...reactLeaflet,
          icon: leafletModule.default.icon,
        } as unknown as LeafletComponents);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const selectedRoute = routeCandidates.find((candidate) => candidate.candidateId === selectedRouteId);
    const routeCoordinates = selectedRoute?.geometry.coordinates.map(
      ([longitude, latitude]): [number, number] => [latitude, longitude],
    ) ?? [];
    const endpointCoordinates: [number, number][] = [originCoordinate, destinationCoordinate]
      .filter((coordinate): coordinate is RouteCoordinate => coordinate !== null && coordinate !== undefined)
      .map((coordinate) => [coordinate.latitude, coordinate.longitude]);
    const relevantBounds = [...routeCoordinates, ...endpointCoordinates];

    if (relevantBounds.length > 1) {
      map.fitBounds(relevantBounds, { padding: [48, 48], maxZoom: PLACE_ZOOM, animate: true });
    } else if (relevantBounds.length === 1) {
      map.setView(relevantBounds[0]!, PLACE_ZOOM, { animate: true });
    } else if (places.length === 0) {
      map.setView(EMPTY_MAP_CENTER, DEFAULT_ZOOM, { animate: false });
    } else if (places.length === 1 && places[0]) {
      map.setView([places[0].coords.lat, places[0].coords.lng], PLACE_ZOOM, { animate: false });
    } else {
      map.fitBounds(
        places.map((place): [number, number] => [place.coords.lat, place.coords.lng]),
        { padding: [48, 48], maxZoom: PLACE_ZOOM, animate: false },
      );
    }
  }, [leaflet, places, routeCandidates, selectedRouteId, originCoordinate, destinationCoordinate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onMapCoordinateSelect) return;
    const handleClick = (event: { latlng: { lat: number; lng: number } }) => {
      onMapCoordinateSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    };
    map.on("click", handleClick);
    return () => map.off("click", handleClick);
  }, [leaflet, onMapCoordinateSelect]);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query || !mapRef.current) return;

    // These are treated as things to search for around the user,
    // rather than geographic locations.
    const categoryKeywords = [
      "museum",
      "museums",
      "restaurant",
      "restaurants",
      "food",
      "cafe",
      "cafes",
      "coffee",
      "beach",
      "beaches",
      "park",
      "parks",
      "temple",
      "temples",
      "church",
      "churches",
      "fort",
      "forts",
      "hotel",
      "hotels",
      "attraction",
      "attractions",
      "tourist",
      "monument",
      "monuments",
    ];

    const isCategorySearch = categoryKeywords.some((keyword) => query.includes(keyword));

    // Searching for a type of place:
    // show the user's current area.
    if (isCategorySearch) {
      getUserLocation()
        .then(([latitude, longitude]) => {
          mapRef.current?.flyTo([latitude, longitude], USER_LOCATION_ZOOM, {
            animate: true,
            duration: 1,
          });
        })
        .catch(() => {
          // If location permission is denied,
          // keep the current map position.
        });

      return;
    }

    // Searching for a geographic area:
    // use OpenStreetMap Nominatim to find the area.
    const controller = new AbortController();

    const searchLocation = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
            searchQuery,
          )}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) return;

        const results = (await response.json()) as Array<{
          lat: string;
          lon: string;
          display_name: string;
        }>;

        const firstResult = results[0];
        if (!firstResult || !mapRef.current) return;

        const latitude = Number(firstResult.lat);
        const longitude = Number(firstResult.lon);

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) return;

        mapRef.current.flyTo([latitude, longitude], SEARCH_AREA_ZOOM, {
          animate: true,
          duration: 1,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Location search failed:", error);
        }
      }
    };

    const timeoutId = window.setTimeout(searchLocation, 500);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!mapRef.current || !activeId) return;
    const activePlace = places.find((place) => place.id === activeId);
    if (activePlace) {
      mapRef.current.flyTo([activePlace.coords.lat, activePlace.coords.lng], 14, {
        animate: true,
        duration: 1,
      });
    }
  }, [activeId, places]);

  useEffect(() => {
    if (recenterTrigger === 0) return;

    recenter();
  }, [recenterTrigger]);

  const getUserLocation = (): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          resolve([coords.latitude, coords.longitude]);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    });
  };

  const recenter = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.flyTo([coords.latitude, coords.longitude], 14, {
          animate: true,
          duration: 1.2,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert(
              "Location permission was denied. Please allow location access in your browser settings and try again.",
            );
            break;

          case error.POSITION_UNAVAILABLE:
            alert(
              "Your current location could not be determined. Please check your device location services.",
            );
            break;

          case error.TIMEOUT:
            alert("Getting your location took too long. Please try again.");
            break;

          default:
            alert("Unable to get your current location. Please try again.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const buttonClass =
    "glass-strong grid h-10 w-10 place-items-center rounded-xl text-foreground shadow-float hover:bg-accent";

  if (!leaflet) {
    return (
      <div
        className={cn("min-h-[400px] rounded-xl bg-muted", className)}
        aria-label="Loading map"
      />
    );
  }

  const { MapContainer, Marker, Popup, Tooltip, Polyline, TileLayer, icon } = leaflet;
  const markerIcon = icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <div className={cn("relative min-h-[400px] overflow-hidden rounded-xl", className)}>
      <MapContainer
        center={initialCenter}
        zoom={places.length === 1 ? PLACE_ZOOM : DEFAULT_ZOOM}
        scrollWheelZoom
        zoomControl={false}
        className="absolute inset-0 z-0 h-full w-full"
        ref={(map: LeafletMap | null) => {
          mapRef.current = map;
        }}
      >
        <TileLayer
          key={mapLayer}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={
            mapLayer === "street"
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          }
        />
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.coords.lat, place.coords.lng]}
            icon={markerIcon}
            eventHandlers={{
              click: () => {
                onSelect?.(place);
                mapRef.current?.flyTo([place.coords.lat, place.coords.lng], 14, {
                  animate: true,
                  duration: 1,
                });
              },
            }}
          >
            <Tooltip>{place.name}</Tooltip>
            <Popup>
              <div className="min-w-[180px]">
                <h3 className="font-semibold">{place.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{place.category}</p>
                <p className="mt-1 text-sm">
                  ⭐ {place.rating} · {place.city}
                </p>
                {place.hiddenGem && (
                  <p className="mt-2 text-xs font-medium text-amber-600">✦ Hidden Gem</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {routeCandidates.map((candidate) => {
          const isSelected = candidate.candidateId === selectedRouteId;
          const positions = candidate.geometry.coordinates.map(
            ([longitude, latitude]): [number, number] => [latitude, longitude],
          );
          return (
            <Polyline
              key={candidate.candidateId}
              positions={positions}
              pathOptions={{
                color: isSelected ? "#0f766e" : "#64748b",
                weight: isSelected ? 6 : 3,
                opacity: isSelected ? 0.95 : 0.38,
              }}
            />
          );
        })}
        {originCoordinate && (
          <Marker position={[originCoordinate.latitude, originCoordinate.longitude]} icon={markerIcon}>
            <Tooltip>Origin</Tooltip>
          </Marker>
        )}
        {destinationCoordinate && (
          <Marker position={[destinationCoordinate.latitude, destinationCoordinate.longitude]} icon={markerIcon}>
            <Tooltip>Destination</Tooltip>
          </Marker>
        )}
      </MapContainer>
      {routeSelectionTarget && (
        <div className="absolute left-4 top-4 z-[1000] rounded-xl bg-card/95 px-3 py-2 text-xs font-semibold shadow-float">
          Click the map to set the {routeSelectionTarget}.
        </div>
      )}
      <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => mapRef.current?.zoomIn()}
          className={buttonClass}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => mapRef.current?.zoomOut()}
          className={buttonClass}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Reset map view"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            if (places.length === 0) {
              map.setView(EMPTY_MAP_CENTER, DEFAULT_ZOOM, { animate: true });
            } else if (places.length === 1) {
              const place = places[0];
              if (place) {
                map.setView(
                  [place.coords.lat, place.coords.lng],
                  PLACE_ZOOM,
                  { animate: true },
                );
              }
            } else {
              map.fitBounds(
                places.map((place): [number, number] => [place.coords.lat, place.coords.lng]),
                { padding: [48, 48], maxZoom: PLACE_ZOOM, animate: true },
              );
            }
          }}
          className={buttonClass}
        >
          <Compass className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Find my location"
          onClick={recenter}
          className={buttonClass}
        >
          <LocateFixed className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Change map layer"
          onClick={() => setMapLayer((current) => (current === "street" ? "hot" : "street"))}
          className={buttonClass}
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  );
}
