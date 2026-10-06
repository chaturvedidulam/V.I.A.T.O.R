import { Timestamp } from "firebase-admin/firestore";

import { db } from "../config/firebase";
import { POI } from "../models/POI";

const pois: Omit<POI, "createdAt" | "updatedAt">[] = [
  {
    id: "POI_athirappilly_waterfalls",
    name: "Athirappilly Waterfalls",
    description:
      "A major waterfall on the Chalakudy River, dropping about 80 metres through forested terrain.",
    category: "waterfall",
    location: { latitude: 10.2847, longitude: 76.569 },
    address: "Athirappilly, Thrissur district, Kerala, India",
    images: [],
    tags: ["waterfall", "river", "forest", "nature"],
    rating: 0,
    reviewCount: 0,
  },
  {
    id: "POI_varkala_cliff",
    name: "Varkala Cliff",
    description:
      "A laterite cliff overlooking the Arabian Sea, lined with a coastal walkway and beaches below.",
    category: "coastal_landmark",
    location: { latitude: 8.7379, longitude: 76.7163 },
    address: "North Cliff, Varkala, Thiruvananthapuram district, Kerala, India",
    images: [],
    tags: ["cliff", "coast", "beach", "arabian_sea"],
    rating: 0,
    reviewCount: 0,
  },
  {
    id: "POI_munnar",
    name: "Munnar",
    description:
      "A hill town in the Western Ghats known for surrounding tea plantations and mountain scenery.",
    category: "hill_station",
    location: { latitude: 10.0889, longitude: 77.0595 },
    address: "Munnar, Idukki district, Kerala, India",
    images: [],
    tags: ["hill_station", "tea", "mountains", "western_ghats"],
    rating: 0,
    reviewCount: 0,
  },
  {
    id: "POI_fort_kochi",
    name: "Fort Kochi",
    description:
      "A historic coastal neighbourhood of Kochi with colonial-era streets and Chinese fishing nets.",
    category: "historic_neighborhood",
    location: { latitude: 9.9658, longitude: 76.2421 },
    address: "Fort Kochi, Kochi, Ernakulam district, Kerala, India",
    images: [],
    tags: ["history", "heritage", "coast", "culture"],
    rating: 0,
    reviewCount: 0,
  },
  {
    id: "POI_periyar_national_park",
    name: "Periyar National Park",
    description:
      "A protected area in the Western Ghats centred on Periyar Lake and known for its wildlife and forests.",
    category: "national_park",
    location: { latitude: 9.462, longitude: 77.2368 },
    address: "Thekkady, Idukki district, Kerala, India",
    images: [],
    tags: ["national_park", "wildlife", "forest", "western_ghats"],
    rating: 0,
    reviewCount: 0,
  },
];

async function seedPOIs(): Promise<void> {
  for (const poi of pois) {
    const now = Timestamp.now();
    const document: POI = {
      ...poi,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("pois").doc(poi.id).set(document);
    console.log(`Seeded ${poi.name} (${poi.id})`);
  }

  console.log(`Successfully wrote ${pois.length} POIs.`);
}

seedPOIs().catch((error: unknown) => {
  console.error("Failed to seed POIs:", error);
  process.exitCode = 1;
});
