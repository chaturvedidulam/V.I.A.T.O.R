import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getMediaById, uploadMedia } from "../services/media.service";
import { getUserByUid, updateProfilePic } from "../services/user.service";
import { errorResponse, successResponse } from "../utils/apiResponse";

export async function uploadMediaController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return errorResponse(
        res,
        "Authenticated user not found.",
        "AUTH_002",
        401
      );
    }

    if (!req.file) {
      return errorResponse(
        res,
        "An image file is required.",
        "MEDIA_001",
        400
      );
    }

    const type = req.body.type;

    if (type !== "profile_picture") {
      return errorResponse(
        res,
        "Invalid media type.",
        "MEDIA_002",
        400
      );
    }

    const media = await uploadMedia(
      req.user.uid,
      req.file.buffer,
      type
    );

    const user = await getUserByUid(req.user.uid);

    if (!user) {
      return errorResponse(
        res,
        "User profile not found.",
        "USER_001",
        404
      );
    }

    await updateProfilePic(user.id, media.id);

    return successResponse(
      res,
      "Media uploaded successfully.",
      media,
      201
    );
  } catch (error) {
    console.error("Media upload error:", error);

    return errorResponse(
      res,
      "Failed to upload media.",
      "MEDIA_003",
      500
    );
  }
}

export async function getMediaController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return errorResponse(
        res,
        "Authenticated user not found.",
        "AUTH_002",
        401
      );
    }

    const mediaId = req.params.id;

    if (typeof mediaId !== "string") {
      return errorResponse(
        res,
        "Invalid media ID.",
        "MEDIA_004",
        404
      );
    }

    const media = await getMediaById(mediaId);

    if (!media) {
      return errorResponse(
        res,
        "Media not found.",
        "MEDIA_004",
        404
      );
    }

    if (media.uid !== req.user.uid) {
      return errorResponse(
        res,
        "You do not have permission to access this media.",
        "MEDIA_005",
        403
      );
    }

    return successResponse(
      res,
      "Media fetched successfully.",
      media
    );
  } catch (error) {
    console.error("Get media error:", error);

    return errorResponse(
      res,
      "Failed to fetch media.",
      "MEDIA_006",
      500
    );
  }
}
