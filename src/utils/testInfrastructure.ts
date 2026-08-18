import { auth, db } from "../config/firebase";
import cloudinary from "../config/cloudinary";

const connectionTestRef = db.collection("_system").doc("connection_test");
const expectedStatus = "connected";

async function testInfrastructure() {
  try {
    await connectionTestRef.set({
      status: expectedStatus,
      testedAt: new Date(),
    });

    const snapshot = await connectionTestRef.get();

    if (snapshot.data()?.status !== expectedStatus) {
      throw new Error("Firestore connection test returned an unexpected value.");
    }

    console.log("Firebase Admin initialization successful.");
    console.log("Firestore write/read successful.");
    console.log(`Firebase Admin Auth initialization successful: ${auth.app.name}.`);

    await cloudinary.api.ping();
    console.log("Cloudinary authenticated runtime verification successful.");
  } catch (error) {
    console.error("Infrastructure verification failed:", error);
    process.exitCode = 1;
  } finally {
    try {
      await connectionTestRef.delete();
      console.log("Firestore cleanup successful.");
    } catch (error) {
      console.error("Firestore cleanup failed:", error);
      process.exitCode = 1;
    }
  }
}

void testInfrastructure();
