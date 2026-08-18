import { Timestamp } from "firebase-admin/firestore";

export interface MediaData {
  cloudinaryPublicId: string;
  url: string;
  resourceType: string;
  format?: string;
  width?: number;
  height?: number;
}

export interface Media {
  id: string;
  uid: string;
  data: MediaData;
  created_at: Timestamp;
  type: string;
}