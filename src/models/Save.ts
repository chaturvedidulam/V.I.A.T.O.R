import { Timestamp } from "firebase-admin/firestore";

export interface Save {
  id: string;
  uid: string;
  poiId: string;
  createdAt: Timestamp;
}
