import { Timestamp } from "firebase-admin/firestore";

import { db } from "../config/firebase";
import { Save } from "../models/Save";
import { generateId } from "../utils/generateId";

const SAVES_COLLECTION = "saves";
const POIS_COLLECTION = "pois";

export type CreateSaveResult =
  | { status: "created"; save: Save }
  | { status: "already_saved" }
  | { status: "poi_not_found" };

export type DeleteSaveResult = { status: "deleted" } | { status: "not_found" };

export async function createSave(uid: string, poiId: string): Promise<CreateSaveResult> {
  const save: Save = {
    id: generateId("SAV"),
    uid,
    poiId,
    createdAt: Timestamp.now(),
  };
  const poiRef = db.collection(POIS_COLLECTION).doc(poiId);
  const saveRef = db.collection(SAVES_COLLECTION).doc(save.id);

  return db.runTransaction(async (transaction) => {
    const poiDocument = await transaction.get(poiRef);
    if (!poiDocument.exists) return { status: "poi_not_found" };

    const existingSaves = await transaction.get(
      db.collection(SAVES_COLLECTION).where("uid", "==", uid).where("poiId", "==", poiId),
    );
    if (!existingSaves.empty) return { status: "already_saved" };

    transaction.create(saveRef, save);
    return { status: "created", save };
  });
}

export async function getSaveByUserAndPOI(uid: string, poiId: string): Promise<Save | null> {
  const snapshot = await db
    .collection(SAVES_COLLECTION)
    .where("uid", "==", uid)
    .where("poiId", "==", poiId)
    .limit(1)
    .get();

  return snapshot.empty ? null : (snapshot.docs[0].data() as Save);
}

export async function deleteSave(uid: string, poiId: string): Promise<DeleteSaveResult> {
  return db.runTransaction(async (transaction) => {
    const matchingSaves = await transaction.get(
      db.collection(SAVES_COLLECTION).where("uid", "==", uid).where("poiId", "==", poiId),
    );
    if (matchingSaves.empty) return { status: "not_found" };

    matchingSaves.docs.forEach((document) => transaction.delete(document.ref));
    return { status: "deleted" };
  });
}

export async function getSavesByUser(uid: string): Promise<Save[]> {
  const snapshot = await db.collection(SAVES_COLLECTION).where("uid", "==", uid).get();
  return snapshot.docs.map((document) => document.data() as Save);
}
