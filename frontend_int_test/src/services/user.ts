import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";

import { PLACES, SAVED_TRIPS, type Place } from "@/data/mock";
import { getFirebaseAuth } from "@/lib/firebase";
import { apiRequest, delay } from "./client";

export interface FirestoreTimestamp {
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
}

export interface UserProfile {
  uid: string;
  id: string;
  name: string;
  email: string;
  role: "traveler" | "local_contributor" | "admin";
  placesRated: number;
  guideLevel: number;
  joinedAt: FirestoreTimestamp;
  lastLogin: FirestoreTimestamp;
  profilePic: string | null;
  location: { latitude: number; longitude: number } | null;
  placesBeenTo: string[];
  followers: string[];
  following: string[];
  bio: string;
}

async function fetchCurrentUser(): Promise<UserProfile> {
  await apiRequest("/auth/me");
  return apiRequest<UserProfile>("/users/me");
}

export async function getUserProfile(): Promise<UserProfile> {
  return fetchCurrentUser();
}

export async function updateUserBio(bio: string): Promise<{ bio: string }> {
  return apiRequest<{ bio: string }>("/users/me", {
    method: "PATCH",
    body: { bio },
  });
}

export async function signIn(email: string, password: string): Promise<UserProfile> {
  await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return fetchCurrentUser();
}

export async function signUp(name: string, email: string, password: string): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  await updateProfile(credential.user, { displayName: name });
  await credential.user.getIdToken(true);
  return fetchCurrentUser();
}

export async function signInWithGoogle(): Promise<UserProfile> {
  await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  return fetchCurrentUser();
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

// These data calls remain mocked because their backend endpoints are outside Phase A.
export async function getBookmarks(): Promise<Place[]> {
  await delay();
  return PLACES.slice(0, 4);
}

export async function getSavedTrips() {
  await delay();
  return SAVED_TRIPS;
}
