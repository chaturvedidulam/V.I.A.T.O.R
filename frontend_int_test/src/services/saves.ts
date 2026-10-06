import { apiRequest } from "./client";
import type { FirestoreTimestamp } from "./user";

export interface Save {
  id: string;
  uid: string;
  poiId: string;
  createdAt: FirestoreTimestamp;
}

export function savePOI(poiId: string): Promise<Save> {
  return apiRequest<Save>(`/pois/${encodeURIComponent(poiId)}/save`, {
    method: "POST",
  });
}

export function unsavePOI(poiId: string): Promise<void> {
  return apiRequest<void>(`/pois/${encodeURIComponent(poiId)}/save`, {
    method: "DELETE",
  });
}

export function getMySaves(): Promise<Save[]> {
  return apiRequest<Save[]>("/users/me/saves");
}
