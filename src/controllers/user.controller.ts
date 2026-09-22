import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getOrCreateUser, getUserByUid, updateUserBio } from "../services/user.service";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function getCurrentUser(
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

    const user = await getOrCreateUser(
      req.user.uid,
      req.user.name ?? "",
      req.user.email ?? ""
    );

    return successResponse(
      res,
      "User profile fetched successfully.",
      user
    );
  } catch (error) {
    console.error("Get current user error:", error);

    return errorResponse(
      res,
      "Failed to fetch user profile.",
      "SYS_001",
      500
    );
  }
}

export async function updateCurrentUserBio(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return errorResponse(res, "Authenticated user not found.", "AUTH_002", 401);
    }

    if (typeof req.body.bio !== "string") {
      return errorResponse(res, "Bio must be a string.", "USER_002", 400);
    }

    const bio = req.body.bio.trim();

    if (bio.length > 500) {
      return errorResponse(res, "Bio must not exceed 500 characters.", "USER_003", 400);
    }

    const user = await getUserByUid(req.user.uid);

    if (!user) {
      return errorResponse(res, "User profile not found.", "USER_001", 404);
    }

    await updateUserBio(user.id, bio);

    return successResponse(res, "Bio updated successfully.", { bio });
  } catch (error) {
    console.error("Update user bio error:", error);

    return errorResponse(res, "Failed to update bio.", "SYS_001", 500);
  }
}
