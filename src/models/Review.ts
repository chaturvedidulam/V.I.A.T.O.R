import { Timestamp } from "firebase-admin/firestore";

export interface Review {
  id: string;
  poiId: string;
  uid: string;
  rating: number;
  text: string;
  media: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
