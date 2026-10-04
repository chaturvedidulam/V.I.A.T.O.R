import { Timestamp } from "firebase-admin/firestore";

export interface POI {
  id: string;
  name: string;
  description: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  images: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
