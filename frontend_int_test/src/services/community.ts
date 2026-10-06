/**
 * COMMUNITY SERVICE — placeholder implementations.
 * Swap for Firestore `posts` / `contributors` collections and Storage uploads.
 */
import { POSTS, CONTRIBUTORS, type Post } from "@/data/mock";
import { delay } from "./client";

/** TODO(firebase): paginated `posts` query ordered by createdAt desc. */
export async function getCommunityFeed(): Promise<Post[]> {
  await delay();
  return POSTS;
}

/** TODO(firebase): transaction incrementing `likeCount` + user like doc. */
export async function toggleLike(_postId: string): Promise<{ ok: boolean }> {
  await delay(200);
  return { ok: true };
}

/** TODO(firebase): write to `users/{uid}/bookmarks`. */
export async function toggleBookmark(_postId: string): Promise<{ ok: boolean }> {
  await delay(200);
  return { ok: true };
}

/** TODO(firebase): follow/unfollow via a Cloud Function to keep counters consistent. */
export async function toggleFollow(_userId: string): Promise<{ ok: boolean }> {
  await delay(200);
  return { ok: true };
}

/** TODO(firebase): aggregated leaderboard written by a scheduled function. */
export async function getLeaderboard() {
  await delay();
  return CONTRIBUTORS;
}

/** TODO(storage + firestore): upload the image then create the post document. */
export async function createPost(_input: {
  caption: string;
  file?: File;
}): Promise<{ ok: boolean }> {
  await delay(800);
  return { ok: true };
}
