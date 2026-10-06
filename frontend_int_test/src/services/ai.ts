/**
 * AI SERVICE — placeholder implementations.
 * Swap for Cloud Functions that call your model provider server-side.
 */
import { RECOMMENDATION_SECTIONS, WEATHER } from "@/data/mock";
import { delay } from "./client";

/** TODO(functions): httpsCallable(functions, "getRecommendations"). */
export async function getRecommendations() {
  await delay();
  return RECOMMENDATION_SECTIONS;
}

/** TODO(functions): streaming assistant endpoint. */
export async function askAssistant(prompt: string): Promise<{ answer: string }> {
  await delay(900);
  return {
    answer: `Here's a plan for "${prompt}": start at the eastern viewpoint before 08:00, walk the ridge path for 40 minutes, then drop into the market for lunch. I've flagged two hidden gems on the way back.`,
  };
}

/** TODO(functions): weather provider proxied through a Cloud Function. */
export async function getWeather(_coords?: { lng: number; lat: number }) {
  await delay(400);
  return WEATHER;
}
