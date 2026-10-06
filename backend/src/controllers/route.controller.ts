import { Request, Response } from "express";
import { RoutePlanningError, planRoute, RoutePlanRequest } from "../services/route.service";
import { errorResponse, successResponse } from "../utils/apiResponse";

const preferences = new Set(["fastest", "scenic", "nature", "food", "culture", "hidden-gems"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validCoordinate(value: unknown): value is { latitude: number; longitude: number } {
  if (!isRecord(value)) return false;
  return typeof value.latitude === "number" && Number.isFinite(value.latitude) &&
    value.latitude >= -90 && value.latitude <= 90 &&
    typeof value.longitude === "number" && Number.isFinite(value.longitude) &&
    value.longitude >= -180 && value.longitude <= 180;
}

export async function planRouteController(req: Request, res: Response) {
  const body: unknown = req.body;
  if (!isRecord(body) || !validCoordinate(body.origin) || !validCoordinate(body.destination) ||
      typeof body.preference !== "string" || !preferences.has(body.preference)) {
    return errorResponse(
      res,
      "A valid origin, destination, and supported preference are required.",
      "VALIDATION_ERROR",
      400
    );
  }

  // Rebuild an allowlisted payload; no client-supplied options reach the process.
  const routeRequest: RoutePlanRequest = {
    origin: { latitude: body.origin.latitude, longitude: body.origin.longitude },
    destination: { latitude: body.destination.latitude, longitude: body.destination.longitude },
    preference: body.preference as RoutePlanRequest["preference"],
  };

  try {
    const result = await planRoute(routeRequest);
    return successResponse(res, "Route plan generated successfully.", result);
  } catch (error) {
    if (error instanceof RoutePlanningError) {
      return errorResponse(res, error.message, error.code, error.statusCode);
    }
    console.error("Route planning error:", error);
    return errorResponse(res, "Route planning is temporarily unavailable.", "ROUTE_ENGINE_ERROR", 502);
  }
}
