import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { uploadMedia } from "../services/media.service";
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