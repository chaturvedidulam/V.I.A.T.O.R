import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";

import { db } from "../config/firebase";
import { env } from "../config/env";

const UNSPLASH_API_BASE = "https://api.unsplash.com";
const SEARCH_RESULT_LIMIT = 10;
const ATTRIBUTION_MANIFEST_PATH = path.resolve(
  __dirname,
  "../../../frontend_int_test/src/data/unsplashPoiAttribution.json",
);

type PoiSeed = {
  poiId: string;
  name: string;
  query: string;
  relevantTerms: readonly string[];
};

const POIS: readonly PoiSeed[] = [
  {
    poiId: "POI_athirappilly_waterfalls",
    name: "Athirappilly Waterfalls",
    query: "Athirappilly Waterfalls Kerala",
    relevantTerms: ["athirappilly", "athirapally"],
  },
  {
    poiId: "POI_varkala_cliff",
    name: "Varkala Cliff",
    query: "Varkala Cliff Kerala",
    relevantTerms: ["varkala"],
  },
  {
    poiId: "POI_munnar",
    name: "Munnar",
    query: "Munnar Kerala",
    relevantTerms: ["munnar"],
  },
  {
    poiId: "POI_fort_kochi",
    name: "Fort Kochi",
    query: "Fort Kochi Kerala",
    relevantTerms: ["fort kochi", "cochin"],
  },
  {
    poiId: "POI_periyar_national_park",
    name: "Periyar National Park",
    query: "Periyar National Park Kerala",
    relevantTerms: ["periyar"],
  },
  {
    poiId: "POI_osm_node_1028617514",
    name: "Banasurasagar Dam / Reservoir",
    query: "Banasura Sagar Dam Kerala",
    relevantTerms: ["banasura"],
  },
  {
    poiId: "POI_osm_node_13591852404",
    name: "Alleppey Backwaters",
    query: "Alleppey Backwaters Kerala",
    relevantTerms: ["alleppey", "alappuzha"],
  },
  {
    poiId: "POI_osm_node_3526233527",
    name: "Jatayu Nature Park",
    query: "Jatayu Nature Park Kerala",
    relevantTerms: ["jatayu"],
  },
  {
    poiId: "POI_osm_relation_4148317",
    name: "Eravikulam National Park",
    query: "Eravikulam National Park Kerala",
    relevantTerms: ["eravikulam"],
  },
  {
    poiId: "POI_osm_relation_21130741",
    name: "Silent Valley National Park",
    query: "Silent Valley National Park Kerala",
    relevantTerms: ["silent valley"],
  },
  {
    poiId: "POI_osm_way_545992145",
    name: "Wayanad Wildlife Sanctuary",
    query: "Wayanad Wildlife Sanctuary Kerala",
    relevantTerms: ["wayanad"],
  },
  {
    poiId: "POI_osm_way_677289011",
    name: "Thattekad Bird Sanctuary",
    query: "Thattekad Bird Sanctuary Kerala",
    relevantTerms: ["thattekad", "salim ali bird sanctuary"],
  },
  {
    poiId: "POI_osm_way_670422415",
    name: "Bekal Fort",
    query: "Bekal Fort Kerala",
    relevantTerms: ["bekal"],
  },
  {
    poiId: "POI_osm_way_722671018",
    name: "Mattancherry Dutch Palace Complex",
    query: "Mattancherry Dutch Palace Kerala",
    relevantTerms: ["mattancherry", "dutch palace"],
  },
  {
    poiId: "POI_osm_way_589578696",
    name: "Mattancherry Paradesi Synagogue",
    query: "Paradesi Synagogue Mattancherry Kerala",
    relevantTerms: ["paradesi synagogue", "mattancherry synagogue"],
  },
  {
    poiId: "POI_osm_way_251499819",
    name: "Muzhappilangad Drive-in Beach",
    query: "Muzhappilangad Drive-in Beach Kerala",
    relevantTerms: ["muzhappilangad"],
  },
  {
    poiId: "POI_osm_way_25977369",
    name: "Cherai Beach",
    query: "Cherai Beach Kerala",
    relevantTerms: ["cherai"],
  },
  {
    poiId: "POI_osm_way_622418623",
    name: "Marari Beach",
    query: "Marari Beach Kerala",
    relevantTerms: ["marari"],
  },
  {
    poiId: "POI_osm_way_1234415228",
    name: "Alappuzha Beach",
    query: "Alappuzha Beach Kerala",
    relevantTerms: ["alappuzha beach", "alleppey beach"],
  },
  {
    poiId: "POI_osm_node_4000672483",
    name: "Ponmudi Hill Station",
    query: "Ponmudi Hill Station Kerala",
    relevantTerms: ["ponmudi"],
  },
  {
    poiId: "POI_osm_node_7428736620",
    name: "Soochipara Water Falls",
    query: "Soochipara Waterfalls Kerala",
    relevantTerms: ["soochipara"],
  },
  {
    poiId: "POI_osm_node_582568263",
    name: "Vazhachal Falls",
    query: "Vazhachal Falls Kerala",
    relevantTerms: ["vazhachal"],
  },
  {
    poiId: "POI_osm_way_1052248958",
    name: "Guruvayur Sree Krishna Temple",
    query: "Guruvayur Sree Krishna Temple Kerala",
    relevantTerms: ["guruvayur"],
  },
  {
    poiId: "POI_osm_way_361046610",
    name: "Sabarimala Ayyappa Swami Temple",
    query: "Sabarimala Ayyappa Temple Kerala",
    relevantTerms: ["sabarimala"],
  },
  {
    poiId: "POI_osm_node_604968570",
    name: "Edakkal Caves",
    query: "Edakkal Caves Kerala",
    relevantTerms: ["edakkal"],
  },
];

const NEW_BATCH_POIS: readonly PoiSeed[] = [
  { poiId: "POI_osm_way_670422415", name: "Bekal Fort", query: "Bekal Fort Kerala", relevantTerms: ["bekal"] },
  { poiId: "POI_osm_way_797814258", name: "Kovalam Tourist Village", query: "Kovalam Tourist Village Kerala", relevantTerms: ["kovalam"] },
  { poiId: "POI_osm_way_25977369", name: "Cherai Beach", query: "Cherai Beach Kerala", relevantTerms: ["cherai"] },
  { poiId: "POI_osm_way_545992145", name: "Wayanad Wildlife Sanctuary", query: "Wayanad Wildlife Sanctuary Kerala", relevantTerms: ["wayanad"] },
  { poiId: "POI_osm_node_604968570", name: "Edakkal Caves", query: "Edakkal Caves Kerala", relevantTerms: ["edakkal"] },
  { poiId: "POI_osm_relation_21130741", name: "Silent Valley National Park", query: "Silent Valley National Park Kerala", relevantTerms: ["silent valley"] },
  { poiId: "POI_osm_way_677289011", name: "Thattekad Bird Sanctuary", query: "Thattekad Bird Sanctuary Kerala", relevantTerms: ["thattekad", "salim ali bird sanctuary"] },
  { poiId: "POI_osm_way_722671018", name: "Mattancherry Dutch Palace Complex", query: "Mattancherry Dutch Palace Complex Kerala", relevantTerms: ["mattancherry", "dutch palace"] },
  { poiId: "POI_osm_node_7428736620", name: "Soochipara Water Falls", query: "Soochipara Water Falls Kerala", relevantTerms: ["soochipara"] },
  { poiId: "POI_osm_way_298999606", name: "Pookode Lake", query: "Pookode Lake Kerala", relevantTerms: ["pookode"] },
  { poiId: "POI_osm_way_1052248958", name: "Guruvayur Sree Krishna Temple", query: "Guruvayur Sree Krishna Temple Kerala", relevantTerms: ["guruvayur"] },
  { poiId: "POI_osm_way_361046610", name: "Sabarimala Ayyappa Swami Temple", query: "Sabarimala Ayyappa Swami Temple Kerala", relevantTerms: ["sabarimala"] },
  { poiId: "POI_osm_node_582568263", name: "Vazhachal Falls", query: "Vazhachal Falls Kerala", relevantTerms: ["vazhachal"] },
  { poiId: "POI_osm_way_251499819", name: "Muzhappilangad Drive-in Beach", query: "Muzhappilangad Drive-in Beach Kerala", relevantTerms: ["muzhappilangad"] },
];

const APPROVED_PHOTO_PINS = [
  { poiId: "POI_osm_node_13591852404", photoId: "-pQjOzw6BBo" },
  { poiId: "POI_osm_relation_4148317", photoId: "oguTHIRSyHQ" },
  { poiId: "POI_osm_way_1234415228", photoId: "OY06toBDDxg" },
] as const;

type UnsplashPhoto = {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: { regular: string };
  links: { html: string; download_location: string };
  user: {
    name: string;
    username: string;
    links: { html: string };
  };
  location: {
    name: string | null;
    city: string | null;
    country: string | null;
  } | null;
  tags?: readonly { title: string }[];
};

type UnsplashSearchResponse = { results: readonly UnsplashPhoto[] };

type SelectedPhoto = {
  poiId: string;
  poiName: string;
  query: string;
  photoId: string;
  photographerName: string;
  photographerUsername: string;
  photographerProfileUrl: string;
  photoPageUrl: string;
  imageUrl: string;
  downloadLocation: string;
};

type AttributionRecord = Omit<SelectedPhoto, "poiId" | "poiName" | "downloadLocation"> & {
  importedAt: string;
};

type PreparedPoi =
  | { poi: PoiSeed; status: "skip"; reason: string }
  | { poi: PoiSeed; status: "missing"; reason: string }
  | { poi: PoiSeed; status: "selected"; photo: SelectedPhoto }
  | { poi: PoiSeed; status: "no-match"; reason: string };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type RunOptions = {
  mode: "dry-run" | "apply";
  approvedOnly: boolean;
  newBatch: boolean;
};

function parseOptions(args: string[]): RunOptions {
  const allowed = new Set(["--dry-run", "--apply", "--approved-only", "--new-batch"]);
  const unknown = args.filter((argument) => !allowed.has(argument));
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(", ")}`);
  if (args.includes("--dry-run") && args.includes("--apply")) {
    throw new Error("Choose either --dry-run or --apply, not both.");
  }
  const approvedOnly = args.includes("--approved-only");
  const newBatch = args.includes("--new-batch");
  if (approvedOnly && !args.includes("--apply")) {
    throw new Error("--approved-only requires --apply.");
  }
  if (approvedOnly && newBatch) {
    throw new Error("Choose either --approved-only or --new-batch, not both.");
  }
  return { mode: args.includes("--apply") ? "apply" : "dry-run", approvedOnly, newBatch };
}

function validHttpsUrl(value: string, hostname: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === hostname;
  } catch {
    return false;
  }
}

function photoMetadata(photo: UnsplashPhoto): string {
  return [
    photo.description,
    photo.alt_description,
    photo.location?.name,
    photo.location?.city,
    photo.location?.country,
    ...(photo.tags?.map((tag) => tag.title) ?? []),
  ].filter((value): value is string => Boolean(value)).join(" ").toLowerCase();
}

function relevanceScore(poi: PoiSeed, photo: UnsplashPhoto): number {
  const metadata = photoMetadata(photo);
  const matchedTerm = poi.relevantTerms.find((term) => metadata.includes(term));
  if (!matchedTerm) return -1;
  let score = 10;
  if (photo.location?.country?.toLowerCase().includes("india")) score += 3;
  if (metadata.includes("kerala")) score += 2;
  if (metadata.includes("waterfall") && poi.poiId === "POI_athirappilly_waterfalls") score += 1;
  if (metadata.includes("cliff") && poi.poiId === "POI_varkala_cliff") score += 1;
  if (metadata.includes("national park") && poi.poiId === "POI_periyar_national_park") score += 1;
  return score;
}

function toSelectedPhoto(poi: PoiSeed, selected: UnsplashPhoto): SelectedPhoto {
  if (!validHttpsUrl(selected.urls.regular, "images.unsplash.com")) {
    throw new Error(`Selected photo ${selected.id} did not include a valid Unsplash image URL.`);
  }
  if (!validHttpsUrl(selected.links.html, "unsplash.com")) {
    throw new Error(`Selected photo ${selected.id} did not include a valid photo page URL.`);
  }
  if (!validHttpsUrl(selected.links.download_location, "api.unsplash.com")) {
    throw new Error(`Selected photo ${selected.id} did not include a valid download tracking URL.`);
  }
  if (!validHttpsUrl(selected.user.links.html, "unsplash.com")) {
    throw new Error(`Selected photo ${selected.id} did not include a valid photographer profile URL.`);
  }
  if (!selected.user.name.trim() || !selected.user.username.trim()) {
    throw new Error(`Selected photo ${selected.id} has incomplete photographer metadata.`);
  }

  return {
    poiId: poi.poiId,
    poiName: poi.name,
    query: poi.query,
    photoId: selected.id,
    photographerName: selected.user.name,
    photographerUsername: selected.user.username,
    photographerProfileUrl: selected.user.links.html,
    photoPageUrl: selected.links.html,
    imageUrl: selected.urls.regular,
    downloadLocation: selected.links.download_location,
  };
}

async function searchPhotos(poi: PoiSeed): Promise<SelectedPhoto | null> {
  const endpoint = new URL(`${UNSPLASH_API_BASE}/search/photos`);
  endpoint.searchParams.set("query", poi.query);
  endpoint.searchParams.set("per_page", String(SEARCH_RESULT_LIMIT));
  endpoint.searchParams.set("orientation", "landscape");
  endpoint.searchParams.set("content_filter", "high");

  const response = await fetch(endpoint, {
    headers: { Authorization: `Client-ID ${env.unsplashAccessKey}` },
  });
  if (!response.ok) {
    throw new Error(`Unsplash search returned HTTP ${response.status}.`);
  }
  const data = await response.json() as UnsplashSearchResponse;
  const ranked = data.results
    .map((photo) => ({ photo, score: relevanceScore(poi, photo) }))
    .filter((candidate) => candidate.score >= 0)
    .sort((a, b) => b.score - a.score);
  const selected = ranked[0]?.photo;
  if (!selected) return null;
  return toSelectedPhoto(poi, selected);
}

async function getApprovedPhoto(pin: typeof APPROVED_PHOTO_PINS[number]): Promise<SelectedPhoto> {
  const poi = POIS.find((candidate) => candidate.poiId === pin.poiId);
  if (!poi) throw new Error(`Approved POI ${pin.poiId} is missing from the curated allowlist.`);

  const endpoint = new URL(`${UNSPLASH_API_BASE}/photos/${encodeURIComponent(pin.photoId)}`);
  const response = await fetch(endpoint, {
    headers: { Authorization: `Client-ID ${env.unsplashAccessKey}` },
  });
  if (!response.ok) throw new Error(`Unsplash photo lookup returned HTTP ${response.status}.`);
  const photo = await response.json() as UnsplashPhoto;
  if (photo.id !== pin.photoId) throw new Error(`Unsplash returned a different photo ID than approved (${pin.photoId}).`);
  if (relevanceScore(poi, photo) < 0) {
    throw new Error(`Approved photo ${pin.photoId} no longer passes the destination metadata relevance check for ${poi.name}.`);
  }
  return toSelectedPhoto(poi, photo);
}

async function prepareApprovedPoi(pin: typeof APPROVED_PHOTO_PINS[number]): Promise<SelectedPhoto | null> {
  const poi = POIS.find((candidate) => candidate.poiId === pin.poiId);
  if (!poi) throw new Error(`Approved POI ${pin.poiId} is missing from the curated allowlist.`);
  const snapshot = await db.collection("pois").doc(poi.poiId).get();
  if (!snapshot.exists) throw new Error(`Approved POI ${poi.poiId} does not exist in Firestore.`);

  const data: unknown = snapshot.data();
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(`Firestore preflight for ${poi.poiId}: POI document has an invalid shape.`);
  }
  const record = data as Record<string, unknown>;
  if (record.name !== poi.name) throw new Error(`Firestore preflight for ${poi.poiId}: POI name mismatch.`);
  const images: unknown = record.images;
  if (!Array.isArray(images) || images.some((image) => typeof image !== "string")) {
    throw new Error(`Firestore preflight for ${poi.poiId}: images is not a string array.`);
  }
  if (images.length > 0) {
    console.log(`[SKIP] Approved POI ${poi.poiId} — ${poi.name}; already has ${images.length} image(s).`);
    return null;
  }

  return getApprovedPhoto(pin);
}

async function preparePoi(poi: PoiSeed): Promise<PreparedPoi> {
  const snapshot = await db.collection("pois").doc(poi.poiId).get();
  if (!snapshot.exists) return { poi, status: "missing", reason: "POI document does not exist." };

  const data: unknown = snapshot.data();
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(`Firestore preflight for ${poi.poiId}: POI document has an invalid shape.`);
  }
  const images: unknown = (data as Record<string, unknown>).images;
  const name: unknown = (data as Record<string, unknown>).name;
  if (name !== poi.name) {
    throw new Error(`Firestore preflight for ${poi.poiId}: expected POI name "${poi.name}" but found a mismatch.`);
  }
  if (!Array.isArray(images) || images.some((image) => typeof image !== "string")) {
    throw new Error(`Firestore preflight for ${poi.poiId}: images is not a string array.`);
  }
  if (images.length > 0) {
    return { poi, status: "skip", reason: `Already has ${images.length} image(s); existing images are preserved.` };
  }

  const photo = await searchPhotos(poi);
  return photo
    ? { poi, status: "selected", photo }
    : { poi, status: "no-match", reason: "No result had destination-specific location/title/description/tag metadata." };
}

async function triggerDownloadTracking(photo: SelectedPhoto): Promise<void> {
  const response = await fetch(photo.downloadLocation, {
    headers: { Authorization: `Client-ID ${env.unsplashAccessKey}` },
  });
  if (!response.ok) {
    throw new Error(`Unsplash download tracking returned HTTP ${response.status}.`);
  }
  // The response is deliberately not used to fetch image bytes; POI images stay hotlinked.
  await response.body?.cancel();
}

async function readAttributionManifest(): Promise<Record<string, AttributionRecord>> {
  try {
    const content = await readFile(ATTRIBUTION_MANIFEST_PATH, "utf8");
    const parsed: unknown = JSON.parse(content);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Attribution manifest must contain a JSON object.");
    }
    return parsed as Record<string, AttributionRecord>;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

async function writeAttributionManifest(
  manifest: Record<string, AttributionRecord>,
): Promise<void> {
  await mkdir(path.dirname(ATTRIBUTION_MANIFEST_PATH), { recursive: true });
  const temporaryPath = `${ATTRIBUTION_MANIFEST_PATH}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await rename(temporaryPath, ATTRIBUTION_MANIFEST_PATH);
}

function logSelected(photo: SelectedPhoto): void {
  console.log(`[SELECTED] POI ${photo.poiId} — ${photo.poiName}; query: "${photo.query}"`);
  console.log(`  Unsplash photo: ${photo.photoId} (${photo.photoPageUrl})`);
  console.log(`  Photographer: ${photo.photographerName} (@${photo.photographerUsername})`);
  console.log(`  Profile: ${photo.photographerProfileUrl}`);
  console.log(`  Image URL: ${photo.imageUrl}`);
}

async function applyPhoto(photo: SelectedPhoto): Promise<void> {
  console.log(`[APPLY] POI ${photo.poiId}; triggering Unsplash download tracking.`);
  await triggerDownloadTracking(photo);

  const reference = db.collection("pois").doc(photo.poiId);
  const result = await db.runTransaction(async (transaction) => {
    const current = await transaction.get(reference);
    if (!current.exists) throw new Error("POI document no longer exists.");
    const currentData: unknown = current.data();
    if (typeof currentData !== "object" || currentData === null || Array.isArray(currentData)) {
      throw new Error("POI document has an invalid shape.");
    }
    const images: unknown = (currentData as Record<string, unknown>).images;
    const name: unknown = (currentData as Record<string, unknown>).name;
    if (name !== photo.poiName) throw new Error("POI name no longer matches the allowlisted name.");
    if (!Array.isArray(images) || images.some((image) => typeof image !== "string")) {
      throw new Error("POI images is not a string array.");
    }
    if (images.length > 0) return "skipped" as const;
    transaction.update(reference, { images: FieldValue.arrayUnion(photo.imageUrl) });
    return "appended" as const;
  });

  if (result === "skipped") {
    console.log(`[SKIP] POI ${photo.poiId}; an image appeared after preflight, so it was preserved.`);
    return;
  }

  try {
    const manifest = await readAttributionManifest();
    manifest[photo.poiId] = {
      query: photo.query,
      photoId: photo.photoId,
      photographerName: photo.photographerName,
      photographerUsername: photo.photographerUsername,
      photographerProfileUrl: photo.photographerProfileUrl,
      photoPageUrl: photo.photoPageUrl,
      imageUrl: photo.imageUrl,
      importedAt: new Date().toISOString(),
    };
    await writeAttributionManifest(manifest);
  } catch (error) {
    throw new Error(`Firestore image append succeeded for ${photo.poiId}, but local attribution manifest update failed: ${errorMessage(error)}`);
  }
  console.log(`[FIRESTORE] POI ${photo.poiId}; appended Unsplash URL; other POI fields preserved.`);
  console.log(`[ATTRIBUTION] POI ${photo.poiId}; local frontend manifest updated.`);
}

async function run(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const pois = options.newBatch ? NEW_BATCH_POIS : POIS;
  console.log(`Unsplash curated POI image mode: ${options.mode}${options.approvedOnly ? " (approved photo IDs only)" : options.newBatch ? " (new candidate batch)" : ""}`);
  if (!env.unsplashAccessKey.trim()) {
    throw new Error("UNSPLASH_ACCESS_KEY is required. No search, download tracking, or Firestore writes were started.");
  }

  let errorCount = 0;
  let selectedCount = 0;
  if (options.approvedOnly) {
    for (const pin of APPROVED_PHOTO_PINS) {
      const poi = POIS.find((candidate) => candidate.poiId === pin.poiId);
      try {
        const photo = await prepareApprovedPoi(pin);
        if (!photo) continue;
        selectedCount += 1;
        logSelected(photo);
        await applyPhoto(photo);
      } catch (error) {
        errorCount += 1;
        console.error(`[ERROR] Approved POI ${pin.poiId}; photo ${pin.photoId}; stage: apply; ${errorMessage(error)}`);
      }
    }
  } else {
    for (const poi of pois) {
      try {
        const prepared = await preparePoi(poi);
        if (prepared.status === "missing") {
          errorCount += 1;
          console.error(`[ERROR] POI ${poi.poiId} — ${poi.name}; stage: Firestore preflight; ${prepared.reason}`);
        } else if (prepared.status === "skip") {
          console.log(`[SKIP] POI ${poi.poiId} — ${poi.name}; query: "${poi.query}"; ${prepared.reason}`);
        } else if (prepared.status === "no-match") {
          console.log(`[NO MATCH] POI ${poi.poiId} — ${poi.name}; query: "${poi.query}"; ${prepared.reason}`);
        } else {
          selectedCount += 1;
          logSelected(prepared.photo);
          if (options.mode === "apply") {
            try {
              await applyPhoto(prepared.photo);
            } catch (error) {
              errorCount += 1;
              console.error(`[ERROR] POI ${poi.poiId}; stage: apply; ${errorMessage(error)}`);
            }
          }
        }
      } catch (error) {
        errorCount += 1;
        console.error(`[ERROR] POI ${poi.poiId} — ${poi.name}; stage: Unsplash search/preflight; ${errorMessage(error)}`);
      }
    }
  }

  if (options.mode === "dry-run") {
    console.log(`Dry run complete: ${selectedCount} candidate(s) selected, ${errorCount} error(s); no Unsplash tracking calls or Firestore writes were performed.`);
  } else {
    console.log(`Apply complete: ${selectedCount} candidate(s) selected, ${errorCount} error(s).`);
  }
  if (errorCount > 0) process.exitCode = 1;
}

run().catch((error: unknown) => {
  console.error(`Unsplash POI image script stopped: ${errorMessage(error)}`);
  process.exitCode = 1;
});
