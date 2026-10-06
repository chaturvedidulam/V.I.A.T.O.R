import { Timestamp } from "firebase-admin/firestore";

import { db } from "../config/firebase";
import cloudinary from "../config/cloudinary";
import { Media, MediaData } from "../models/Media";
import { generateId } from "../utils/generateId";

import type { UploadApiResponse } from "cloudinary";

const MEDIA_COLLECTION = "media";

export class MediaRecordWriteError extends Error {
  constructor(
    public readonly media: Media,
    public readonly originalError: unknown,
  ) {
    super("Cloudinary upload succeeded, but the Media record could not be written.");
    this.name = "MediaRecordWriteError";
  }
}

export async function getMediaById(
  id: string
): Promise<Media | null> {
  const document = await db
    .collection(MEDIA_COLLECTION)
    .doc(id)
    .get();

  if (!document.exists) {
    return null;
  }

  return document.data() as Media;
}

export async function uploadMedia(
  uid: string,
  fileBuffer: Buffer,
  type: string,
  uploadFolder = `viator/${uid}`,
): Promise<Media> {
  const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });

  const mediaId = generateId("MED");

  const data: MediaData = {
    cloudinaryPublicId: uploadResult.public_id,
    url: uploadResult.secure_url,
    resourceType: uploadResult.resource_type,
    format: uploadResult.format,
    width: uploadResult.width,
    height: uploadResult.height,
  };

  const media: Media = {
    id: mediaId,
    uid,
    data,
    created_at: Timestamp.now(),
    type,
  };

  try {
    await db
      .collection(MEDIA_COLLECTION)
      .doc(mediaId)
      .set(media);
  } catch (error) {
    throw new MediaRecordWriteError(media, error);
  }

  return media;
}
