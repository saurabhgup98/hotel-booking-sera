import Link from "next/link";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connectDB();
  const hotels = await Hotel.find({}).lean<any[]>();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Hotels</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {hotels.map((hotel) => (
          <Link
            key={hotel._id.toString()}
            href={`/hotels/${hotel._id.toString()}`}
            id={`hotel-card-${hotel._id.toString()}`}
            className="block rounded border bg-white p-4 hover:shadow"
          >
            <h2 className="font-semibold">{hotel.name}</h2>
            <p className="text-sm text-gray-500">{hotel.city}</p>
            <p className="mt-2 text-sm">{hotel.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
