/**
 * ADMIN SERVICE — placeholder implementations.
 * Swap for Cloud Functions guarded by a custom `admin` auth claim.
 */
import { ADMIN_METRICS, USER_GROWTH, REPORTS } from "@/data/mock";
import { delay } from "./client";

/** TODO(functions): aggregate metrics; never query raw collections client-side. */
export async function getAdminMetrics() {
  await delay();
  return ADMIN_METRICS;
}

/** TODO(functions): analytics timeseries. */
export async function getGrowthSeries() {
  await delay();
  return USER_GROWTH;
}

/** TODO(firebase): `reports` collection, admin-only rules. */
export async function getReports() {
  await delay();
  return REPORTS;
}

/** TODO(functions): moderation action with an audit-log write. */
export async function resolveReport(
  _id: string,
  _action: "approve" | "remove",
): Promise<{ ok: boolean }> {
  await delay(300);
  return { ok: true };
}

/** TODO(functions): generate a CSV in Storage and return a signed URL. */
export async function exportReports(): Promise<{ url: string }> {
  await delay(600);
  return { url: "#" };
}
