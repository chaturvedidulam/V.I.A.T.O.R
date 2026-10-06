import { apiRequest } from "./client";

export interface Review {
  id: string;
  poiId: string;
  uid: string;
  rating: number;
  text: string;
  media: string[];
  createdAt: string;
  updatedAt: string;
}

export function getReviews(poiId: string): Promise<Review[]> {
  return apiRequest<Review[]>(`/pois/${encodeURIComponent(poiId)}/reviews`, {
    authentication: false,
  });
}

export function createReview(
  poiId: string,
  rating: number,
  text: string,
  media: string[] = [],
): Promise<Review> {
  return apiRequest<Review>(`/pois/${encodeURIComponent(poiId)}/reviews`, {
    method: "POST",
    body: { rating, text, media },
  });
}

export function updateReview(
  reviewId: string,
  rating: number,
  text: string,
  media: string[] = [],
): Promise<Review> {
  return apiRequest<Review>(`/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PATCH",
    body: { rating, text, media },
  });
}

export function deleteReview(reviewId: string): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
  });
}
