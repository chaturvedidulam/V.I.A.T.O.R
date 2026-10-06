import { Timestamp } from "firebase-admin/firestore";

import { db } from "../config/firebase";
import { POI } from "../models/POI";
import { Review } from "../models/Review";
import { generateId } from "../utils/generateId";

const POIS_COLLECTION = "pois";
const REVIEWS_COLLECTION = "reviews";

export type CreateReviewResult =
  | { status: "created"; review: Review }
  | { status: "poi_not_found" };

export type ReviewMutationResult =
  | { status: "updated"; review: Review }
  | { status: "deleted" }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "poi_not_found" };

function calculateRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
}

export async function getReviewsByPOI(poiId: string): Promise<Review[]> {
  const snapshot = await db
    .collection(REVIEWS_COLLECTION)
    .where("poiId", "==", poiId)
    .get();

  return snapshot.docs.map((document) => document.data() as Review);
}

export async function getReviewById(id: string): Promise<Review | null> {
  const document = await db.collection(REVIEWS_COLLECTION).doc(id).get();
  return document.exists ? (document.data() as Review) : null;
}

export async function createReview(
  poiId: string,
  uid: string,
  rating: number,
  text: string,
  media: string[],
): Promise<CreateReviewResult> {
  const now = Timestamp.now();
  const review: Review = {
    id: generateId("REV"),
    poiId,
    uid,
    rating,
    text,
    media,
    createdAt: now,
    updatedAt: now,
  };
  const poiRef = db.collection(POIS_COLLECTION).doc(poiId);
  const reviewRef = db.collection(REVIEWS_COLLECTION).doc(review.id);

  return db.runTransaction(async (transaction) => {
    const poiDocument = await transaction.get(poiRef);
    if (!poiDocument.exists) return { status: "poi_not_found" };

    const existingReviews = await transaction.get(
      db.collection(REVIEWS_COLLECTION).where("poiId", "==", poiId),
    );
    const ratings = existingReviews.docs.map(
      (document) => (document.data() as Review).rating,
    );
    ratings.push(review.rating);

    transaction.set(reviewRef, review);
    transaction.update(poiRef, {
      rating: calculateRating(ratings),
      reviewCount: ratings.length,
    });

    return { status: "created", review };
  });
}

export async function updateReview(
  id: string,
  uid: string,
  updates: Partial<Pick<Review, "rating" | "text" | "media">>,
): Promise<ReviewMutationResult> {
  const reviewRef = db.collection(REVIEWS_COLLECTION).doc(id);

  return db.runTransaction(async (transaction) => {
    const reviewDocument = await transaction.get(reviewRef);
    if (!reviewDocument.exists) return { status: "not_found" };

    const currentReview = reviewDocument.data() as Review;
    if (currentReview.uid !== uid) return { status: "forbidden" };

    const poiRef = db.collection(POIS_COLLECTION).doc(currentReview.poiId);
    const poiDocument = await transaction.get(poiRef);
    if (!poiDocument.exists) return { status: "poi_not_found" };

    const poiReviews = await transaction.get(
      db
        .collection(REVIEWS_COLLECTION)
        .where("poiId", "==", currentReview.poiId),
    );
    const updatedReview: Review = {
      ...currentReview,
      ...updates,
      updatedAt: Timestamp.now(),
    };
    const ratings = poiReviews.docs.map((document) => {
      const poiReview = document.data() as Review;
      return document.id === id ? updatedReview.rating : poiReview.rating;
    });

    transaction.update(reviewRef, {
      ...updates,
      updatedAt: updatedReview.updatedAt,
    });
    transaction.update(poiRef, {
      rating: calculateRating(ratings),
      reviewCount: ratings.length,
    });

    return { status: "updated", review: updatedReview };
  });
}

export async function deleteReview(
  id: string,
  uid: string,
): Promise<ReviewMutationResult> {
  const reviewRef = db.collection(REVIEWS_COLLECTION).doc(id);

  return db.runTransaction(async (transaction) => {
    const reviewDocument = await transaction.get(reviewRef);
    if (!reviewDocument.exists) return { status: "not_found" };

    const review = reviewDocument.data() as Review;
    if (review.uid !== uid) return { status: "forbidden" };

    const poiRef = db.collection(POIS_COLLECTION).doc(review.poiId);
    const poiDocument = await transaction.get(poiRef);
    if (!poiDocument.exists) return { status: "poi_not_found" };

    const poiReviews = await transaction.get(
      db.collection(REVIEWS_COLLECTION).where("poiId", "==", review.poiId),
    );
    const remainingRatings = poiReviews.docs
      .filter((document) => document.id !== id)
      .map((document) => (document.data() as Review).rating);

    transaction.delete(reviewRef);
    transaction.update(poiRef, {
      rating: calculateRating(remainingRatings),
      reviewCount: remainingRatings.length,
    });

    return { status: "deleted" };
  });
}
