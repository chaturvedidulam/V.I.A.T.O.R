import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";

import { db } from "../config/firebase";
import type { Media } from "../models/Media";
import { MediaRecordWriteError, uploadMedia } from "../services/media.service";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const CLOUDINARY_FOLDER = "viator/poi";
const POI_IMAGES_DIRECTORY = path.resolve(__dirname, "poi-images");

type PoiImageManifestEntry = {
  poiId: string;
  filename: string;
  sourceLicenseNote: string;
};

// Replace each PENDING note with a verified source/license record before applying uploads.
const MANIFEST: readonly PoiImageManifestEntry[] = [
  {
    poiId: "POI_athirappilly_waterfalls",
    filename: "athirappilly-waterfalls.jpg",
    sourceLicenseNote: "PENDING: record the approved local image source and license before upload.",
  },
  {
    poiId: "POI_varkala_cliff",
    filename: "varkala-cliff.jpg",
    sourceLicenseNote: "PENDING: record the approved local image source and license before upload.",
  },
  {
    poiId: "POI_munnar",
    filename: "munnar.jpg",
    sourceLicenseNote: "PENDING: record the approved local image source and license before upload.",
  },
  {
    poiId: "POI_fort_kochi",
    filename: "fort-kochi.jpg",
    sourceLicenseNote: "PENDING: record the approved local image source and license before upload.",
  },
  {
    poiId: "POI_periyar_national_park",
    filename: "periyar-national-park.jpg",
    sourceLicenseNote: "PENDING: record the approved local image source and license before upload.",
  },
];

type PreparedEntry =
  | { entry: PoiImageManifestEntry; status: "ready"; buffer: Buffer }
  | { entry: PoiImageManifestEntry; status: "skip"; reason: string }
  | { entry: PoiImageManifestEntry; status: "blocked"; reason: string };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function imageMimeType(buffer: Buffer): string | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return "image/png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) return "image/gif";
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) return "image/webp";
  return null;
}

function extensionMatchesMime(filename: string, mimeType: string): boolean {
  const extension = path.extname(filename).toLowerCase();
  const validExtensions: Record<string, readonly string[]> = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
  };
  return validExtensions[mimeType]?.includes(extension) ?? false;
}

async function prepareEntry(entry: PoiImageManifestEntry): Promise<PreparedEntry> {
  const poiReference = db.collection("pois").doc(entry.poiId);
  const snapshot = await poiReference.get();
  if (!snapshot.exists) {
    return { entry, status: "blocked", reason: "POI document does not exist." };
  }

  const rawData: unknown = snapshot.data();
  if (typeof rawData !== "object" || rawData === null || Array.isArray(rawData)) {
    return { entry, status: "blocked", reason: "POI document has an invalid shape." };
  }
  const images: unknown = (rawData as Record<string, unknown>).images;
  if (!Array.isArray(images) || images.some((image) => typeof image !== "string")) {
    return { entry, status: "blocked", reason: "POI images field is not a string array." };
  }
  if (images.length > 0) {
    return { entry, status: "skip", reason: `POI already has ${images.length} image(s); existing images are preserved.` };
  }

  const blockers: string[] = [];
  let buffer: Buffer | null = null;
  if (path.basename(entry.filename) !== entry.filename) {
    blockers.push("Manifest filename must be a simple local filename.");
  } else {
    const filePath = path.resolve(POI_IMAGES_DIRECTORY, entry.filename);
    if (!filePath.startsWith(`${POI_IMAGES_DIRECTORY}${path.sep}`)) {
      blockers.push("Image path must remain inside the POI image directory.");
    } else {
      try {
        const fileStats = await stat(filePath);
        if (!fileStats.isFile()) blockers.push("Image path is not a file.");
        else if (fileStats.size === 0) blockers.push("Image file is empty.");
        else if (fileStats.size > MAX_IMAGE_BYTES) {
          blockers.push(`Image exceeds the 5 MB limit (${fileStats.size} bytes).`);
        } else {
          const fileBuffer = await readFile(filePath);
          const mimeType = imageMimeType(fileBuffer);
          if (!mimeType || !extensionMatchesMime(entry.filename, mimeType)) {
            blockers.push("File content is not a supported JPEG, PNG, GIF, or WebP image matching its extension.");
          } else if (fileBuffer.length > MAX_IMAGE_BYTES) {
            blockers.push(`Image exceeds the 5 MB limit (${fileBuffer.length} bytes).`);
          } else {
            buffer = fileBuffer;
          }
        }
      } catch (error) {
        blockers.push(`Cannot read local image: ${errorMessage(error)}`);
      }
    }
  }
  if (entry.sourceLicenseNote.startsWith("PENDING:")) {
    blockers.push(entry.sourceLicenseNote);
  }
  if (blockers.length > 0 || !buffer) {
    return {
      entry,
      status: "blocked",
      reason: blockers.join(" ") || "Local image could not be prepared.",
    };
  }

  return { entry, status: "ready", buffer };
}

function parseMode(args: string[]): "dry-run" | "apply" {
  const allowed = new Set(["--dry-run", "--apply"]);
  const unknown = args.filter((argument) => !allowed.has(argument));
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(", ")}`);
  if (args.includes("--dry-run") && args.includes("--apply")) {
    throw new Error("Choose either --dry-run or --apply, not both.");
  }
  return args.includes("--apply") ? "apply" : "dry-run";
}

async function run(): Promise<void> {
  const mode = parseMode(process.argv.slice(2));
  const uploaderUid = process.env.VIATOR_POI_IMAGE_UPLOADER_UID?.trim();
  console.log(`POI image attachment mode: ${mode}`);
  console.log(`Local image directory: ${POI_IMAGES_DIRECTORY}`);
  console.log(`Uploader UID configured: ${uploaderUid ? "yes" : "no"}`);

  if (mode === "apply" && !uploaderUid) {
    throw new Error("VIATOR_POI_IMAGE_UPLOADER_UID is required for --apply. No uploads or writes were started.");
  }

  const preparedEntries = await Promise.all(MANIFEST.map(prepareEntry));
  let blockedCount = 0;
  for (const prepared of preparedEntries) {
    if (prepared.status === "skip") {
      console.log(`[SKIP] POI ${prepared.entry.poiId}; file ${prepared.entry.filename}; ${prepared.reason}`);
    } else if (prepared.status === "blocked") {
      blockedCount += 1;
      console.log(`[BLOCKED] POI ${prepared.entry.poiId}; file ${prepared.entry.filename}; ${prepared.reason}`);
    } else {
      console.log(`[READY] POI ${prepared.entry.poiId}; file ${prepared.entry.filename}; source/license: ${prepared.entry.sourceLicenseNote}`);
    }
  }

  if (mode === "dry-run") {
    if (blockedCount > 0) {
      console.log(`Dry run complete: ${blockedCount} manifest item(s) are blocked pending local images and verified source/license notes. No Cloudinary uploads or Firestore writes were performed.`);
    } else {
      console.log("Dry run complete: ready entries would upload to Cloudinary and append their secure URLs. No writes were performed.");
    }
    return;
  }

  if (blockedCount > 0) {
    throw new Error(`${blockedCount} manifest item(s) failed preflight. No Cloudinary uploads or Firestore writes were started.`);
  }

  for (const prepared of preparedEntries) {
    if (prepared.status !== "ready") continue;
    const { entry, buffer } = prepared;
    console.log(`[UPLOAD] POI ${entry.poiId}; local filename ${entry.filename}`);

    let media: Media;
    try {
      media = await uploadMedia(uploaderUid!, buffer, "poi_image", CLOUDINARY_FOLDER);
    } catch (error) {
      if (error instanceof MediaRecordWriteError) {
        console.error(`[FAILURE] POI ${entry.poiId}; local filename ${entry.filename}; Cloudinary public ID ${error.media.data.cloudinaryPublicId}; URL ${error.media.data.url}; MED ID ${error.media.id} was not saved to Firestore; media-record failure: ${errorMessage(error.originalError)}. Orphaned Cloudinary upload requires manual handling.`);
      } else {
        console.error(`[FAILURE] POI ${entry.poiId}; local filename ${entry.filename}; Cloudinary/media upload failed: ${errorMessage(error)}`);
      }
      throw new Error(`Stopped after upload failure for POI ${entry.poiId}.`);
    }

    console.log(`[UPLOADED] POI ${entry.poiId}; local filename ${entry.filename}; Cloudinary public ID ${media.data.cloudinaryPublicId}; URL ${media.data.url}; MED ID ${media.id}`);
    if (!media.data.url.startsWith("https://")) {
      console.error(`[FAILURE] POI ${entry.poiId}; URL is not HTTPS. Cloudinary public ID ${media.data.cloudinaryPublicId}; MED ID ${media.id}; Firestore update result: not attempted.`);
      throw new Error(`Stopped after Cloudinary returned a non-HTTPS URL for POI ${entry.poiId}.`);
    }

    try {
      const poiReference = db.collection("pois").doc(entry.poiId);
      const updateResult = await db.runTransaction(async (transaction) => {
        const currentPoi = await transaction.get(poiReference);
        if (!currentPoi.exists) throw new Error("POI document no longer exists.");
        const currentData: unknown = currentPoi.data();
        if (typeof currentData !== "object" || currentData === null || Array.isArray(currentData)) {
          throw new Error("POI document has an invalid shape.");
        }
        const currentImages: unknown = (currentData as Record<string, unknown>).images;
        if (!Array.isArray(currentImages) || currentImages.some((image) => typeof image !== "string")) {
          throw new Error("POI images field is not a string array.");
        }
        if (currentImages.length > 0) return "skipped" as const;
        transaction.update(poiReference, { images: FieldValue.arrayUnion(media.data.url) });
        return "appended" as const;
      });
      console.log(updateResult === "appended"
        ? `[FIRESTORE] POI ${entry.poiId}; Firestore update result: appended URL; other POI fields preserved.`
        : `[FIRESTORE] POI ${entry.poiId}; Firestore update result: skipped because an image was added after preflight. The Cloudinary asset and Media record remain unattached; Cloudinary public ID ${media.data.cloudinaryPublicId}; URL ${media.data.url}; MED ID ${media.id}.`);
    } catch (error) {
      console.error(`[FAILURE] POI ${entry.poiId}; local filename ${entry.filename}; Cloudinary public ID ${media.data.cloudinaryPublicId}; URL ${media.data.url}; MED ID ${media.id}; Firestore update result: FAILED (${errorMessage(error)}). The uploaded Cloudinary asset and Media record remain unattached to the POI and require manual handling.`);
      throw new Error(`Stopped after Firestore attachment failure for POI ${entry.poiId}.`);
    }
  }

  console.log("POI image attachment run completed.");
}

run().catch((error: unknown) => {
  console.error(`POI image attachment stopped: ${errorMessage(error)}`);
  process.exitCode = 1;
});
