import { config } from "dotenv";
config({ path: ".env.local" });

import { connectDB } from "../lib/db";
import Hotel from "../models/Hotel";

async function main() {
  await connectDB();

  const seedHotels = [
    {
      name: "Grand Meridian Hotel",
      city: "Mumbai",
      description: "A dummy seaside hotel used for SDK tracking tests.",
      images: [],
      roomTypes: [
        { name: "Deluxe Room", pricePerNight: 4500, capacity: 2, description: "City-view deluxe room." },
        { name: "Executive Suite", pricePerNight: 8500, capacity: 3, description: "Spacious suite with lounge access." },
      ],
    },
    {
      name: "Highland Retreat",
      city: "Manali",
      description: "A dummy hill-station hotel used for SDK tracking tests.",
      images: [],
      roomTypes: [
        { name: "Deluxe Room", pricePerNight: 3800, capacity: 2, description: "Mountain-view deluxe room." },
        { name: "Executive Suite", pricePerNight: 7200, capacity: 4, description: "Family suite with fireplace." },
      ],
    },
  ];

  for (const hotel of seedHotels) {
    // Upsert by (name, city) so re-running this script is safe. Note: this
    // replaces the whole roomTypes array each run, which regenerates
    // roomType _ids — fine for a first-time seed, but re-seeding after real
    // bookings exist would orphan their roomTypeId references. Intended to
    // be run once against a fresh database.
    await Hotel.findOneAndUpdate(
      { name: hotel.name, city: hotel.city },
      { $set: hotel },
      { upsert: true, new: true }
    );
    console.log(`Upserted hotel: ${hotel.name} (${hotel.city})`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
