import type { Place, Review, Business } from "@/data/mock";
import { ApiError, apiRequest, delay } from "./client";

export interface POIApiResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  images: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

function toPlace(poi: POIApiResponse): Place {
  const addressParts = poi.address.split(",").map((part) => part.trim());
  const districtIndex = addressParts.findIndex((part) => /district/i.test(part));
  const city = districtIndex > 0 ? addressParts[districtIndex - 1] : addressParts[0];
  const category = poi.category
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    id: poi.id,
    name: poi.name,
    category,
    city: city || poi.address,
    country: addressParts.at(-1) || "",
    address: poi.address,
    image: poi.images[0] || "",
    gallery: poi.images,
    rating: poi.rating,
    reviewCount: poi.reviewCount,
    distanceKm: 0,
    etaMin: 0,
    priceLevel: 1,
    hiddenGem: false,
    verified: false,
    tags: poi.tags,
    coords: { lng: poi.location.longitude, lat: poi.location.latitude },
    summary: poi.description,
    history: "",
    hours: "",
    bestTime: "",
    scores: { experience: 0, community: 0, scenic: 0 },
  };
}

/** Fetches the publicly readable POI collection from the backend. */
export async function getNearbyPlaces(
  _coords?: { lng: number; lat: number },
  _radiusKm = 25,
): Promise<Place[]> {
  const pois = await apiRequest<POIApiResponse[]>("/pois", { authentication: false });
  return pois.map(toPlace);
}

/** Fetches a single POI. Returns null when its ID does not exist. */
export async function getPlaceById(id: string): Promise<Place | null> {
  try {
    const poi = await apiRequest<POIApiResponse>(`/pois/${encodeURIComponent(id)}`, {
      authentication: false,
    });
    return toPlace(poi);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** TODO: Replace when the place search API is implemented. */
export async function searchPlaces(term: string): Promise<Place[]> {
  await delay();
  const { PLACES } = await import("@/data/mock");
  const t = term.trim().toLowerCase();
  if (!t) return PLACES;
  return PLACES.filter((p) =>
    [p.name, p.city, p.country, p.category, ...p.tags].join(" ").toLowerCase().includes(t),
  );
}

/** TODO: Replace when the hidden-gem API is implemented. */
export async function getHiddenGems(): Promise<Place[]> {
  await delay();
  const { HIDDEN_GEMS } = await import("@/data/mock");
  return HIDDEN_GEMS;
}

/** TODO: Replace when the trending-places API is implemented. */
export async function getTrendingPlaces(): Promise<Place[]> {
  await delay();
  const { TRENDING_PLACES } = await import("@/data/mock");
  return TRENDING_PLACES;
}

/** TODO: Replace when place reviews are implemented. */
export async function getPlaceReviews(_placeId: string): Promise<Review[]> {
  await delay();
  const { REVIEWS } = await import("@/data/mock");
  return REVIEWS;
}

/** TODO: Replace when nearby businesses are implemented. */
export async function getNearbyBusinesses(category?: string): Promise<Business[]> {
  await delay();
  const { BUSINESSES } = await import("@/data/mock");
  if (!category || category === "All") return BUSINESSES;
  return BUSINESSES.filter((b) => b.category === category);
}
