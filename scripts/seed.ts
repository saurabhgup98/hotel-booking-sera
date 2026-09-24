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
      description: "A relaxed seaside stay in the heart of Mumbai, close to the city's best sights and dining.",
      address: "14 Marine Drive, Mumbai, Maharashtra 400020",
      images: [],
      roomTypes: [
        { name: "Deluxe Room", pricePerNight: 4500, capacity: 2, description: "City-view deluxe room." },
        { name: "Executive Suite", pricePerNight: 8500, capacity: 3, description: "Spacious suite with lounge access." },
      ],
      reviews: [
        { reviewerName: "Anjali Rao", rating: 5, comment: "Beautiful sea view and the staff were incredibly attentive." },
        { reviewerName: "Vikram Shah", rating: 4, comment: "Great location, though breakfast options could be wider." },
      ],
    },
    {
      name: "Colaba Heights Hotel",
      city: "Mumbai",
      description: "A polished business hotel steps from the Gateway of India, built for both work and weekend trips.",
      address: "22 Shahid Bhagat Singh Road, Colaba, Mumbai, Maharashtra 400001",
      images: [],
      roomTypes: [
        { name: "Deluxe Room", pricePerNight: 5200, capacity: 2, description: "Modern room with a working desk." },
        { name: "Executive Suite", pricePerNight: 9500, capacity: 3, description: "Corner suite with skyline views." },
      ],
      reviews: [
        { reviewerName: "Neha Kulkarni", rating: 5, comment: "Perfect for a business trip — fast wifi, quiet rooms." },
        { reviewerName: "Rohan Desai", rating: 4, comment: "Walking distance to Gateway of India, loved it." },
        { reviewerName: "Farah Sheikh", rating: 4, comment: "Comfortable stay, checkout could be quicker." },
      ],
    },
    {
      name: "Highland Retreat",
      city: "Manali",
      description: "A cosy hill-station retreat surrounded by pine forests, perfect for a quiet mountain getaway.",
      address: "Log Hut Area, Manali, Himachal Pradesh 175131",
      images: [],
      roomTypes: [
        { name: "Deluxe Room", pricePerNight: 3800, capacity: 2, description: "Mountain-view deluxe room." },
        { name: "Executive Suite", pricePerNight: 7200, capacity: 4, description: "Family suite with fireplace." },
      ],
      reviews: [
        { reviewerName: "Priya Nair", rating: 5, comment: "The fireplace suite made our winter trip unforgettable." },
        { reviewerName: "Karan Mehta", rating: 4, comment: "Gorgeous views, just a bit of a walk from the main market." },
      ],
    },
    {
      name: "Riverside Pines Resort",
      city: "Manali",
      description: "A riverside resort on the banks of the Beas, with bonfire evenings and mountain trails nearby.",
      address: "Riverside Road, Old Manali, Himachal Pradesh 175131",
      images: [],
      roomTypes: [
        { name: "Deluxe Room", pricePerNight: 4100, capacity: 2, description: "Riverside room with a private balcony." },
        { name: "Executive Suite", pricePerNight: 7800, capacity: 4, description: "Large suite with bonfire-deck access." },
      ],
      reviews: [
        { reviewerName: "Simran Kaur", rating: 5, comment: "Falling asleep to the river sound was magical." },
        { reviewerName: "Arjun Bhatt", rating: 5, comment: "Bonfire nights and great trekking guides nearby." },
        { reviewerName: "Meera Joshi", rating: 3, comment: "Lovely setting, but rooms could use better heating." },
      ],
    },
  ];

  for (const hotel of seedHotels) {
    // Upsert by (name, city) so re-running this script is safe. Note: this
    // replaces the whole roomTypes/reviews arrays each run, which regenerates
    // their _ids — fine for a first-time seed, but re-seeding after real
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
