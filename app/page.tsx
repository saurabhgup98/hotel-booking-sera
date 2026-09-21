import Link from "next/link";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connectDB();
  const hotels = await Hotel.find({}).lean<any[]>();

  return (
    <div className="space-y-8">
      <section className="space-y-2 py-6 text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Find your next stay</h1>
        <p className="mx-auto max-w-md text-slate-500">
          Hand-picked hotels in top destinations, with easy booking and instant confirmation.
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        {hotels.map((hotel) => {
          const fromPrice = Math.min(...hotel.roomTypes.map((rt: any) => rt.pricePerNight));
          return (
            <div
              key={hotel._id.toString()}
              id={`hotel-card-${hotel._id.toString()}`}
              className="overflow-hidden rounded-2xl border bg-white shadow-md transition hover:shadow-lg"
            >
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 text-4xl font-bold text-white">
                {hotel.name.charAt(0)}
              </div>
              <div className="space-y-2 p-5">
                <h2 className="text-lg font-semibold text-slate-900">{hotel.name}</h2>
                <p className="flex items-center gap-1 text-sm text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                  </svg>
                  {hotel.city}
                </p>
                <p className="line-clamp-2 text-sm text-slate-600">{hotel.description}</p>
                <p className="pt-1 text-sm font-medium text-amber-600">From ₹{fromPrice} / night</p>
                <Link
                  id={`hotel-details-btn-${hotel._id.toString()}`}
                  href={`/hotels/${hotel._id.toString()}`}
                  className="mt-2 inline-block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center font-medium text-white hover:bg-indigo-700"
                >
                  View Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
