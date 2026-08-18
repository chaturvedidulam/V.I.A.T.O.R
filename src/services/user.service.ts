import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";

import { db } from "../config/firebase";
import { User, UserRole } from "../models/User";
import { generateId } from "../utils/generateId";

const USERS_COLLECTION = "users";

export async function getUserByUid(
  uid: string
): Promise<User | null> {
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where("uid", "==", uid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as User;
}

export async function getUserById(
  id: string
): Promise<User | null> {
  const document = await db
    .collection(USERS_COLLECTION)
    .doc(id)
    .get();

  if (!document.exists) {
    return null;
  }

  return document.data() as User;
}

export async function createUser(
  uid: string,
  name: string,
  email: string
): Promise<User> {
  const now = Timestamp.now();

  const user: User = {
    uid,
    id: generateId("USR"),
    name,
    email,
    role: "traveler" as UserRole,
    placesRated: 0,
    guideLevel: 0,
    joinedAt: now,
    lastLogin: now,
    profilePic: null,
    location: null,
    placesBeenTo: [],
    followers: [],
    following: [],
  };

  await db
    .collection(USERS_COLLECTION)
    .doc(user.id)
    .set(user);

  return user;
}

export async function getOrCreateUser(
  uid: string,
  name: string,
  email: string
): Promise<User> {
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction
      .get(
        db
          .collection(USERS_COLLECTION)
          .where("uid", "==", uid)
          .limit(1)
      );

    if (!snapshot.empty) {
      return snapshot.docs[0].data() as User;
    }

    const now = Timestamp.now();

    const user: User = {
      uid,
      id: generateId("USR"),
      name,
      email,
      role: "traveler" as UserRole,
      placesRated: 0,
      guideLevel: 0,
      joinedAt: now,
      lastLogin: now,
      profilePic: null,
      location: null,
      placesBeenTo: [],
      followers: [],
      following: [],
    };

    const userRef = db
      .collection(USERS_COLLECTION)
      .doc(user.id);

    transaction.set(userRef, user);

    return user;
  });
}

export async function updateLastLogin(
  id: string
): Promise<void> {
  await db
    .collection(USERS_COLLECTION)
    .doc(id)
    .update({
      lastLogin: FieldValue.serverTimestamp(),
    });
}