import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createSave, deleteSave, getSavesByUser } from "../services/save.service";
import { errorResponse, successResponse } from "../utils/apiResponse";

export async function createPOISaveController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, "Authenticated user not found.", "AUTH_002", 401);
    }

    const poiId = req.params.id;
    if (typeof poiId !== "string") {
      return errorResponse(res, "Invalid POI ID.", "POI_001", 404);
    }

    const result = await createSave(req.user.uid, poiId);
    if (result.status === "poi_not_found") {
      return errorResponse(res, "POI not found.", "POI_001", 404);
    }
    if (result.status === "already_saved") {
      return errorResponse(res, "This POI is already saved.", "SAVE_001", 409);
    }

    return successResponse(res, "POI saved successfully.", result.save, 201);
  } catch (error) {
    console.error("Create POI save error:", error);
    return errorResponse(res, "Failed to save POI.", "SYS_001", 500);
  }
}

export async function deletePOISaveController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, "Authenticated user not found.", "AUTH_002", 401);
    }

    const poiId = req.params.id;
    if (typeof poiId !== "string") {
      return errorResponse(res, "Invalid POI ID.", "POI_001", 404);
    }

    const result = await deleteSave(req.user.uid, poiId);
    if (result.status === "not_found") {
      return errorResponse(res, "Saved POI not found.", "SAVE_002", 404);
    }

    return successResponse(res, "POI unsaved successfully.", { poiId });
  } catch (error) {
    console.error("Delete POI save error:", error);
    return errorResponse(res, "Failed to unsave POI.", "SYS_001", 500);
  }
}

export async function getCurrentUserSavesController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return errorResponse(res, "Authenticated user not found.", "AUTH_002", 401);
    }

    const saves = await getSavesByUser(req.user.uid);
    return successResponse(res, "User saves fetched successfully.", saves);
  } catch (error) {
    console.error("Get current user saves error:", error);
    return errorResponse(res, "Failed to fetch saves.", "SYS_001", 500);
  }
}
