import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getOrCreateUser } from "../services/user.service";
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