import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";
import HotelDetailClient from "./HotelDetailClient";

export const dynamic = "force-dynamic";

export default async function HotelDetailPage({ params }: { params: { hotelId: string } }) {
  if (!mongoose.isValidObjectId(params.hotelId)) notFound();

  await connectDB();
  const hotel = await Hotel.findById(params.hotelId).lean<any>();
  if (!hotel) notFound();

  return (
    <div className="space-y-6">
      <Link
        id="back-to-hotels-btn"
        href="/"
        className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:border-indigo-600 hover:text-indigo-600"
      >
        ← Back to Hotels
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{hotel.name}</h1>
        <p className="mt-1 flex items-center gap-1 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
          </svg>
          {hotel.city}
        </p>
        <p className="mt-2 text-slate-600">{hotel.description}</p>
        {hotel.address && (
          <p id="hotel-address" className="mt-1 text-sm text-slate-500">
            {hotel.address}
          </p>
        )}
      </div>

      <HotelDetailClient hotel={JSON.parse(JSON.stringify(hotel))} />

      {hotel.reviews?.length > 0 && (
        <div id="hotel-reviews-section" className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Guest Reviews</h2>
          <div className="space-y-3">
            {hotel.reviews.map((review: any) => (
              <div key={review._id?.toString()} className="review-item rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{review.reviewerName}</p>
                  <p className="text-sm font-medium text-amber-600">{"★".repeat(review.rating)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
