import { apiRequest } from "./client";

export type RoutePreference = "fastest" | "scenic" | "nature" | "food" | "culture" | "hidden-gems";

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type RouteGeometry = {
  type: "LineString";
  /** GeoJSON coordinate order: [longitude, latitude]. */
  coordinates: [number, number][];
};

export type NearbyRoutePoi = {
  id: string;
  name: string;
  category: string;
  distanceFromRouteMeters: number;
  tags: string[];
};

export type RouteScoreBreakdown = {
  [key: string]: number | Record<string, number>;
  categoryEvidenceCounts?: Record<string, number>;
  categoryCountPer100Km?: Record<string, number>;
};

export type RouteEvidence = {
  nearbyPoiCount: number;
  matchedCategories: string[];
  categoryCounts: Record<string, number>;
  corridorMeters: number;
  evidenceLevel: "none" | "sparse" | "moderate" | "strong";
  meaning: string;
};

export type RouteCandidate = {
  candidateId: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: RouteGeometry;
  nearbyPoiCount: number;
  categoryCounts: Record<string, number>;
  evidence: RouteEvidence;
  nearbyPois: NearbyRoutePoi[];
  natureCount?: number;
  waterfallCount?: number;
  wildlifeCount?: number;
  parkCount?: number;
  beachCount?: number;
  foodCount?: number;
  heritageCount?: number;
  museumCount?: number;
  religiousCount?: number;
  score: number | null;
  scoreBreakdown: RouteScoreBreakdown;
  recommendationReason: string;
  recommended: boolean;
  detourFromFastestMeters: number;
  detourFromFastestSeconds: number;
  detourFromFastestDurationPercent?: number;
};

/** Shape returned by the route engine inside the standard API response envelope. */
export type RoutePlanResult = {
  success: true;
  preference: RoutePreference;
  preferenceSupported: boolean;
  recommendationMethod: string;
  recommendedCandidateId: string | null;
  recommendationReason: string;
  corridorMeters: number;
  candidateCount: number;
  generationWarnings: string[];
  scoringWeights: Record<string, number>;
  candidates: RouteCandidate[];
};

export type RouteRequest = {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  preference: RoutePreference;
};

export async function getRoutes(request: RouteRequest): Promise<RoutePlanResult> {
  const result = await apiRequest<RoutePlanResult>("/routes/plan", {
    method: "POST",
    body: request,
    authentication: false,
  });

  if (!result || result.success !== true || !Array.isArray(result.candidates)) {
    throw new Error("The route service returned an invalid response.");
  }
  return result;
}
