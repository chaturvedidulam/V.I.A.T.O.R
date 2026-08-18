export type UserRole =
  | "traveler"
  | "local_contributor"
  | "admin";

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface User {
  uid: string;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  placesRated: number;
  guideLevel: number;
  joinedAt: FirebaseFirestore.Timestamp;
  lastLogin: FirebaseFirestore.Timestamp;
  profilePic: string | null;
  location: UserLocation | null;
  placesBeenTo: string[];
  followers: string[];
  following: string[];
}