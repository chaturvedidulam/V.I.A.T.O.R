import { db } from "../config/firebase";
import { POI } from "../models/POI";

const POIS_COLLECTION = "pois";

export async function getAllPOIs(): Promise<POI[]> {
  const snapshot = await db.collection(POIS_COLLECTION).get();
  return snapshot.docs.map((document) => document.data() as POI);
}

export async function getPOIById(id: string): Promise<POI | null> {
  const document = await db.collection(POIS_COLLECTION).doc(id).get();

  if (!document.exists) {
    return null;
  }

  return document.data() as POI;
}
