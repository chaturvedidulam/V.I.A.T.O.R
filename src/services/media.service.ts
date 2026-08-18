import { Timestamp } from "firebase-admin/firestore";

import { db } from "../config/firebase";
import cloudinary from "../config/cloudinary";
import { Media, MediaData } from "../models/Media";
import { generateId } from "../utils/generateId";

import type { UploadApiResponse } from "cloudinary";

const MEDIA_COLLECTION = "media";

export async function uploadMedia(
  uid: string,
  fileBuffer: Buffer,
  type: string
): Promise<Media> {
  const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `viator/${uid}`,
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

  await db
    .collection(MEDIA_COLLECTION)
    .doc(mediaId)
    .set(media);

  return media;
}