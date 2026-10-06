import { Request, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getPOIById } from "../services/poi.service";
import {
  createReview,
  deleteReview,
  getReviewById,
  getReviewsByPOI,
  ReviewMutationResult,
  updateReview,
} from "../services/review.service";
import { errorResponse, successResponse } from "../utils/apiResponse";

type ReviewFields = {
  rating?: number;
  text?: string;
  media?: string[];
};

type ValidationResult =
  | { fields: ReviewFields }
  | { error: string };

const allowedFields = new Set(["rating", "text", "media"]);
const mediaIdPattern = /^MED_[A-Za-z0-9_-]+$/;

function hasField(body: Record<string, unknown>, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, field);
}

function validateReviewFields(
  value: unknown,
  requireRatingAndText: boolean,
): ValidationResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { error: "Request body must be an object." };
  }

  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !allowedFields.has(key))) {
    return { error: "Only rating, text, and media may be provided." };
  }

  const hasRating = hasField(body, "rating");
  const hasText = hasField(body, "text");
  const hasMedia = hasField(body, "media");

  if (requireRatingAndText && (!hasRating || !hasText)) {
    return { error: "Rating and text are required." };
  }
  if (!requireRatingAndText && !hasRating && !hasText && !hasMedia) {
    return { error: "Provide at least one field to update." };
  }

  const fields: ReviewFields = {};

  if (hasRating) {
    const rating = body.rating;
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { error: "Rating must be an integer between 1 and 5." };
    }
    fields.rating = rating;
  }

  if (hasText) {
    if (typeof body.text !== "string") {
      return { error: "Review text must be a string." };
    }
    const text = body.text.trim();
    if (text.length === 0) {
      return { error: "Review text must not be empty." };
    }
    if (text.length > 2000) {
      return { error: "Review text must not exceed 2000 characters." };
    }
    fields.text = text;
  }

  if (hasMedia) {
    if (!Array.isArray(body.media)) {
      return { error: "Media must be an array of MED_* IDs." };
    }
    if (
      !body.media.every(
        (mediaId) => typeof mediaId === "string" && mediaIdPattern.test(mediaId),
      )
    ) {
      return { error: "Each media entry must be a valid MED_* ID." };
    }
    fields.media = body.media as string[];
  }

  return { fields };
}

function reviewIdFromRequest(req: Request, res: Response): string | null {
  const reviewId = req.params.id;
  if (typeof reviewId !== "string") {
    errorResponse(res, "Invalid review ID.", "REV_001", 404);
    return null;
  }
  return reviewId;
}

function mutationErrorResponse(res: Response, result: ReviewMutationResult) {
  if (result.status === "not_found") {
    return errorResponse(res, "Review not found.", "REV_001", 404);
  }
  if (result.status === "forbidden") {
    return errorResponse(res, "You do not have permission to change this review.", "AUTH_003", 403);
  }
  if (result.status === "poi_not_found") {
    return errorResponse(res, "POI not found.", "POI_001", 404);
  }
  return null;
}

export async function getPOIReviewsController(req: Request, res: Response) {
  try {
    const poiId = req.params.id;
    if (typeof poiId !== "string") {
      return errorResponse(res, "Invalid POI ID.", "POI_001", 404);
    }

    const poi = await getPOIById(poiId);
    if (!poi) {
      return errorResponse(res, "POI not found.", "POI_001", 404);
    }

    const reviews = await getReviewsByPOI(poiId);
    return successResponse(res, "Reviews fetched successfully.", reviews);
  } catch (error) {
    console.error("Get POI reviews error:", error);
    return errorResponse(res, "Failed to fetch reviews.", "SYS_001", 500);
  }
}

export async function createPOIReviewController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return errorResponse(res, "Authenticated user not found.", "AUTH_002", 401);
    }

    const poiId = req.params.id;
    if (typeof poiId !== "string") {
      return errorResponse(res, "Invalid POI ID.", "POI_001", 404);
    }

    const validation = validateReviewFields(req.body, true);
    if ("error" in validation) {
      return errorResponse(res, validation.error, "REV_002", 400);
    }

    const poi = await getPOIById(poiId);
    if (!poi) {
      return errorResponse(res, "POI not found.", "POI_001", 404);
    }

    const result = await createReview(
      poiId,
      req.user.uid,
      validation.fields.rating!,
      validation.fields.text!,
      validation.fields.media ?? [],
    );
    if (result.status === "poi_not_found") {
      return errorResponse(res, "POI not found.", "POI_001", 404);
    }

    return successResponse(res, "Review created successfully.", result.review, 201);
  } catch (error) {
    console.error("Create POI review error:", error);
    return errorResponse(res, "Failed to create review.", "SYS_001", 500);
  }
}

export async function updateReviewController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return errorResponse(res, "Authenticated user not found.", "AUTH_002", 401);
    }

    const reviewId = reviewIdFromRequest(req, res);
    if (!reviewId) return;

    const review = await getReviewById(reviewId);
    if (!review) {
      return errorResponse(res, "Review not found.", "REV_001", 404);
    }
    if (review.uid !== req.user.uid) {
      return errorResponse(res, "You do not have permission to change this review.", "AUTH_003", 403);
    }

    const validation = validateReviewFields(req.body, false);
    if ("error" in validation) {
      return errorResponse(res, validation.error, "REV_002", 400);
    }

    const result = await updateReview(reviewId, req.user.uid, validation.fields);
    const errorResponseResult = mutationErrorResponse(res, result);
    if (errorResponseResult) return errorResponseResult;

    if (result.status !== "updated") {
      return errorResponse(res, "Failed to update review.", "SYS_001", 500);
    }
    return successResponse(res, "Review updated successfully.", result.review);
  } catch (error) {
    console.error("Update review error:", error);
    return errorResponse(res, "Failed to update review.", "SYS_001", 500);
  }
}

export async function deleteReviewController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return errorResponse(res, "Authenticated user not found.", "AUTH_002", 401);
    }

    const reviewId = reviewIdFromRequest(req, res);
    if (!reviewId) return;

    const review = await getReviewById(reviewId);
    if (!review) {
      return errorResponse(res, "Review not found.", "REV_001", 404);
    }
    if (review.uid !== req.user.uid) {
      return errorResponse(res, "You do not have permission to change this review.", "AUTH_003", 403);
    }

    const result = await deleteReview(reviewId, req.user.uid);
    const errorResponseResult = mutationErrorResponse(res, result);
    if (errorResponseResult) return errorResponseResult;
    if (result.status !== "deleted") {
      return errorResponse(res, "Failed to delete review.", "SYS_001", 500);
    }

    return successResponse(res, "Review deleted successfully.", { id: reviewId });
  } catch (error) {
    console.error("Delete review error:", error);
    return errorResponse(res, "Failed to delete review.", "SYS_001", 500);
  }
}
