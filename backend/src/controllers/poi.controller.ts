import { Request, Response } from "express";

import { getAllPOIs, getPOIById } from "../services/poi.service";
import { errorResponse, successResponse } from "../utils/apiResponse";

export async function getAllPOIsController(
  _req: Request,
  res: Response
) {
  try {
    const pois = await getAllPOIs();
    return successResponse(res, "POIs fetched successfully.", pois);
  } catch (error) {
    console.error("Get all POIs error:", error);
    return errorResponse(res, "Failed to fetch POIs.", "SYS_001", 500);
  }
}

export async function getPOIByIdController(
  req: Request,
  res: Response
) {
  try {
    const poiId = req.params.id;

    if (typeof poiId !== "string") {
      return errorResponse(res, "Invalid POI ID.", "POI_001", 404);
    }

    const poi = await getPOIById(poiId);

    if (!poi) {
      return errorResponse(res, "POI not found.", "POI_001", 404);
    }

    return successResponse(res, "POI fetched successfully.", poi);
  } catch (error) {
    console.error("Get POI error:", error);
    return errorResponse(res, "Failed to fetch POI.", "SYS_001", 500);
  }
}
