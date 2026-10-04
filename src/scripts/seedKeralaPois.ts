import { Timestamp } from "firebase-admin/firestore";

import { db } from "../config/firebase";
import type { POI } from "../models/POI";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const MAX_IMPORTED_POIS = 300;
const DUPLICATE_DISTANCE_METERS = 45;
const KERALA_QUERY = `
[out:json][timeout:90];
area["boundary"="administrative"]["admin_level"="4"]["name"="Kerala"]->.kerala;
(
  nwr(area.kerala)["tourism"~"^(attraction|museum|viewpoint|zoo|theme_park|gallery|aquarium|camp_site|picnic_site)$"];
  nwr(area.kerala)["natural"~"^(waterfall|beach|hot_spring|cave_entrance|peak|cliff|spring)$"];
  nwr(area.kerala)["leisure"~"^(nature_reserve|park|garden)$"];
  nwr(area.kerala)["boundary"="national_park"];
  nwr(area.kerala)["historic"~"^(monument|memorial|castle|fort|archaeological_site|ruins|wayside_shrine|manor)$"];
);
out center tags;
`;

type OSMElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = { elements?: OSMElement[]; remark?: string };
type LocatedPOI = { poi: Omit<POI, "createdAt" | "updatedAt">; sourceKey: string; priority: number };

const FEATURE_KEYS = ["tourism", "natural", "leisure", "boundary", "historic", "amenity"];
const HISTORIC_VALUES = new Set([
  "monument", "memorial", "castle", "fort", "archaeological_site", "ruins", "wayside_shrine", "manor",
]);

function normalizedName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function coordinates(element: OSMElement): { latitude: number; longitude: number } | null {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (
    latitude === undefined || longitude === undefined ||
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
  ) return null;
  return { latitude, longitude };
}

function distanceMeters(a: POI["location"], b: POI["location"]): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function categoryFor(tags: Record<string, string>): string {
  if (tags.natural === "waterfall") return "waterfall";
  if (tags.natural === "beach") return "beach";
  if (tags.tourism === "viewpoint" || tags.natural === "peak" || tags.natural === "cliff") return "viewpoint";
  if (tags.tourism === "museum") return "museum";
  if (tags.boundary === "national_park" || tags.leisure === "nature_reserve") return "wildlife";
  if (tags.historic === "wayside_shrine" || tags.amenity === "place_of_worship") return "religious";
  if (tags.historic) return "heritage";
  if (tags.leisure === "park" || tags.leisure === "garden") return "park";
  if (tags.natural) return "nature";
  if (tags.tourism === "camp_site" || tags.tourism === "picnic_site") return "adventure";
  if (tags.tourism === "zoo" || tags.tourism === "aquarium") return "wildlife";
  if (tags.amenity === "restaurant" || tags.amenity === "cafe") return "food";
  if (tags.tourism || tags.leisure) return "attraction";
  return "other";
}

function toLocatedPOI(element: OSMElement): LocatedPOI | null {
  const tags = element.tags ?? {};
  const name = tags["name:en"]?.trim() || tags.name?.trim() || tags["name:ml"]?.trim();
  const location = coordinates(element);
  if (!name) return null;
  if (!location) return null;

  const category = categoryFor(tags);
  const sourceTags = FEATURE_KEYS
    .filter((key) => tags[key])
    .map((key) => `${key}:${tags[key]}`);
  const usefulTags = [...new Set([category, ...sourceTags])];
  const address = tags["addr:full"]?.trim() || [
    tags["addr:street"], tags["addr:suburb"], tags["addr:city"], tags["addr:town"],
    tags["addr:village"], tags["addr:district"], tags["addr:state"], tags["addr:postcode"], tags["addr:country"],
  ].filter((part): part is string => Boolean(part?.trim())).filter((part, index, all) => all.indexOf(part) === index).join(", ");
  const description = tags["description:en"]?.trim() || tags.description?.trim() || "";
  const sourceKey = `${element.type}_${element.id}`;
  const stableSuffix = sourceKey.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  const poi: Omit<POI, "createdAt" | "updatedAt"> = {
    id: `POI_osm_${stableSuffix}`,
    name,
    description,
    category,
    location,
    address,
    images: [],
    tags: usefulTags,
    rating: 0,
    reviewCount: 0,
  };
  const priority =
    (tags.boundary === "national_park" || tags.leisure === "nature_reserve" ? 12 : 0) +
    (tags.tourism === "attraction" || tags.tourism === "viewpoint" ? 8 : 0) +
    (tags.natural ? 7 : 0) +
    (tags.historic && HISTORIC_VALUES.has(tags.historic) ? 5 : 0) +
    (tags.tourism === "museum" || tags.tourism === "zoo" || tags.tourism === "aquarium" ? 5 : 0) +
    (tags.wikipedia || tags.wikidata ? 3 : 0) +
    (description ? 2 : 0) +
    (address ? 1 : 0);
  return { poi, sourceKey, priority };
}

async function fetchOSMElements(): Promise<OSMElement[]> {
  const failures: string[] = [];
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "VIATOR-Kerala-POI-seed/1.0 (OpenStreetMap data import)",
        },
        body: new URLSearchParams({ data: KERALA_QUERY }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as OverpassResponse;
      if (payload.remark) throw new Error(payload.remark);
      if (!Array.isArray(payload.elements)) throw new Error("Overpass returned no elements array.");
      return payload.elements;
    } catch (error) {
      failures.push(`${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`Unable to fetch OSM data from Overpass. ${failures.join(" | ")}`);
}

function duplicateOf(
  candidate: LocatedPOI,
  existing: Array<Pick<POI, "id" | "name" | "location">>,
): Pick<POI, "id" | "name" | "location"> | undefined {
  const candidateName = normalizedName(candidate.poi.name);
  return existing.find((poi) => {
    if (normalizedName(poi.name) !== candidateName) return false;
    return distanceMeters(poi.location, candidate.poi.location) <= DUPLICATE_DISTANCE_METERS;
  });
}

async function seedKeralaPOIs(): Promise<void> {
  const elements = await fetchOSMElements();
  const rejectedByReason = new Map<string, number>();
  const rejectedExamples: string[] = [];
  let rejected = 0;
  let deduplicated = 0;
  const countReject = (reason: string, example: string) => {
    rejected += 1;
    rejectedByReason.set(reason, (rejectedByReason.get(reason) ?? 0) + 1);
    if (rejectedExamples.length < 20) rejectedExamples.push(`${reason}: ${example}`);
  };

  const seenSourceKeys = new Set<string>();
  const candidates: LocatedPOI[] = [];
  for (const element of elements) {
    const sourceKey = `${element.type}_${element.id}`;
    if (seenSourceKeys.has(sourceKey)) {
      deduplicated += 1;
      continue;
    }
    seenSourceKeys.add(sourceKey);

    const converted = toLocatedPOI(element);
    if (!converted) {
      const hasName = Boolean(element.tags?.["name:en"]?.trim() || element.tags?.name?.trim() || element.tags?.["name:ml"]?.trim());
      countReject(hasName ? "invalid_coordinates" : "missing_name", `${sourceKey} ${element.tags?.name ?? "(unnamed)"}`);
      continue;
    }
    if (converted.poi.category === "other") {
      countReject("irrelevant_object", `${sourceKey} ${converted.poi.name}`);
      continue;
    }
    candidates.push(converted);
  }

  candidates.sort((a, b) => b.priority - a.priority || a.poi.name.localeCompare(b.poi.name) || a.sourceKey.localeCompare(b.sourceKey));
  const collection = await db.collection("pois").get();
  const existingDocuments = collection.docs.map((document) => document.data() as POI);
  const existingById = new Map(collection.docs.map((document) => [document.id, document.data() as POI]));
  const selected: LocatedPOI[] = [];

  for (const candidate of candidates) {
    const duplicate = duplicateOf(candidate, [...existingDocuments, ...selected.map(({ poi }) => poi)]);
    if (duplicate && duplicate.id !== candidate.poi.id) {
      deduplicated += 1;
      continue;
    }
    if (selected.length >= MAX_IMPORTED_POIS && !existingById.has(candidate.poi.id)) {
      countReject("quality_limit_300", `${candidate.sourceKey} ${candidate.poi.name}`);
      continue;
    }
    selected.push(candidate);
  }

  const batch = db.batch();
  const now = Timestamp.now();
  for (const candidate of selected) {
    const existing = existingById.get(candidate.poi.id);
    const record: POI = {
      ...candidate.poi,
      images: existing?.images ?? [],
      rating: existing?.rating ?? 0,
      reviewCount: existing?.reviewCount ?? 0,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    batch.set(db.collection("pois").doc(record.id), record);
  }
  if (selected.length) await batch.commit();

  const categoryCounts = selected.reduce<Record<string, number>>((counts, candidate) => {
    counts[candidate.poi.category] = (counts[candidate.poi.category] ?? 0) + 1;
    return counts;
  }, {});
  console.log(JSON.stringify({
    source: "OpenStreetMap via Overpass API (ODbL)",
    fetched: elements.length,
    accepted: selected.length,
    rejected,
    rejectedByReason: Object.fromEntries(rejectedByReason),
    rejectedExamples,
    deduplicated,
    written: selected.length,
    finalPOIs: collection.size + selected.filter(({ poi }) => !existingById.has(poi.id)).length,
    categoryCounts,
    preservedCuratedIds: [
      "POI_athirappilly_waterfalls",
      "POI_varkala_cliff",
      "POI_munnar",
      "POI_fort_kochi",
      "POI_periyar_national_park",
    ],
  }, null, 2));
}

seedKeralaPOIs().catch((error: unknown) => {
  console.error("Kerala POI seed failed:", error);
  process.exitCode = 1;
});
