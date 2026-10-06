import { db } from "../config/firebase";

async function testFirebase() {
  try {
    const testRef = db.collection("_system").doc("connection_test");

    await testRef.set({
      status: "connected",
      testedAt: new Date(),
    });

    const snapshot = await testRef.get();

    console.log("Firebase connection successful:");
    console.log(snapshot.data());
  } catch (error) {
    console.error("Firebase connection failed:");
    console.error(error);
    process.exit(1);
  }
}

testFirebase();