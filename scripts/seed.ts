import { config } from "dotenv";
config({ path: ".env.local" });

import { connectDB } from "../lib/db";
import { unsplash } from "../lib/constants";
import Hotel from "../models/Hotel";

async function main() {
  await connectDB();

  const seedHotels = [
    {
      legacyName: "Grand Meridian Hotel",
      name: "Sera Grand Meridian Hotel",
      city: "Mumbai",
      description: "A relaxed seaside stay in the heart of Mumbai, close to the city's best sights and dining.",
      address: "14 Marine Drive, Mumbai, Maharashtra 400020",
      images: [
        unsplash("1542314831-068cd1dbfeeb"),
        unsplash("1611892440504-42a792e24d32"),
        unsplash("1618773928121-c32242e63f39"),
        unsplash("1590490360182-c33d57733427"),
        unsplash("1582719478250-c89cae4dc85b"),
      ],
      amenities: ["Free Wi-Fi", "Swimming pool", "Sea-view restaurant", "Spa", "Airport transfer", "Fitness centre"],
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
      legacyName: "Colaba Heights Hotel",
      name: "Sera Colaba Heights Hotel",
      city: "Mumbai",
      description: "A polished business hotel steps from the Gateway of India, built for both work and weekend trips.",
      address: "22 Shahid Bhagat Singh Road, Colaba, Mumbai, Maharashtra 400001",
      images: [
        unsplash("1564501049412-61c2a3083791"),
        unsplash("1590490360182-c33d57733427"),
        unsplash("1618773928121-c32242e63f39"),
        unsplash("1611892440504-42a792e24d32"),
        unsplash("1582719478250-c89cae4dc85b"),
      ],
      amenities: ["Free Wi-Fi", "Business centre", "Rooftop bar", "Swimming pool", "24/7 room service", "Fitness centre"],
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
      legacyName: "Highland Retreat",
      name: "Sera Highland Retreat",
      city: "Manali",
      description: "A cosy hill-station retreat surrounded by pine forests, perfect for a quiet mountain getaway.",
      address: "Log Hut Area, Manali, Himachal Pradesh 175131",
      images: [
        unsplash("1445019980597-93fa8acb246c"),
        unsplash("1464822759023-fed622ff2c3b"),
        unsplash("1582719478250-c89cae4dc85b"),
        unsplash("1611892440504-42a792e24d32"),
        unsplash("1618773928121-c32242e63f39"),
      ],
      amenities: ["Free Wi-Fi", "Mountain views", "In-room fireplace", "Multi-cuisine restaurant", "Guided treks", "Free parking"],
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
      legacyName: "Riverside Pines Resort",
      name: "Sera Riverside Pines Resort",
      city: "Manali",
      description: "A riverside resort on the banks of the Beas, with bonfire evenings and mountain trails nearby.",
      address: "Riverside Road, Old Manali, Himachal Pradesh 175131",
      images: [
        unsplash("1566073771259-6a8506099945"),
        unsplash("1464822759023-fed622ff2c3b"),
        unsplash("1582719478250-c89cae4dc85b"),
        unsplash("1590490360182-c33d57733427"),
        unsplash("1611892440504-42a792e24d32"),
      ],
      amenities: ["Free Wi-Fi", "Riverside deck", "Bonfire evenings", "Heated pool", "Trekking desk", "Free parking"],
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

  for (const { legacyName, ...hotel } of seedHotels) {
    // Matched by either the pre-rebrand or the current name, so this renames
    // existing hotels in place (keeping their _id, which bookings and hotel
    // URLs point at). For an existing hotel only the presentational fields
    // are updated — roomTypes/reviews are left untouched because replacing
    // those arrays regenerates their _ids and orphans existing bookings'
    // roomTypeId. They're only written when the hotel is created fresh.
    const existing = await Hotel.findOne({ city: hotel.city, name: { $in: [legacyName, hotel.name] } });
    if (existing) {
      const { roomTypes, reviews, ...presentational } = hotel;
      await Hotel.updateOne({ _id: existing._id }, { $set: presentational });
      console.log(`Updated hotel: ${hotel.name} (${hotel.city})`);
    } else {
      await Hotel.create(hotel);
      console.log(`Created hotel: ${hotel.name} (${hotel.city})`);
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
