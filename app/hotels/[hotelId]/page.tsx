import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";
import { FALLBACK_HOTEL_IMAGE } from "@/lib/constants";
import HotelDetailClient from "./HotelDetailClient";

export const dynamic = "force-dynamic";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex text-sera-brass" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" fill={i <= rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
          <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" />
        </svg>
      ))}
    </span>
  );
}

export default async function HotelDetailPage({ params }: { params: { hotelId: string } }) {
  if (!mongoose.isValidObjectId(params.hotelId)) notFound();

  await connectDB();
  const hotel = await Hotel.findById(params.hotelId).lean<any>();
  if (!hotel) notFound();

  const images: string[] = hotel.images?.length ? hotel.images : [FALLBACK_HOTEL_IMAGE];
  const reviews: any[] = hotel.reviews ?? [];
  const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-6 sm:px-6">
      <Link
        id="back-to-hotels-btn"
        href="/"
        className="inline-flex items-center gap-1.5 rounded-full border border-sera-line bg-white px-4 py-1.5 text-sm font-medium text-sera-muted hover:border-sera-forest hover:text-sera-forest"
      >
        ← Back to Hotels
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-sera-brass">{hotel.city.toUpperCase()}</p>
          <h1 className="mt-1 font-display text-4xl leading-tight text-sera-ink sm:text-5xl">{hotel.name}</h1>
          {hotel.address && (
            <p id="hotel-address" className="mt-2 flex items-center gap-1.5 text-sm text-sera-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-none" aria-hidden="true">
                <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {hotel.address}
            </p>
          )}
        </div>
        {rating !== null && (
          <a href="#hotel-reviews-section" className="flex items-center gap-3 rounded-2xl border border-sera-line bg-white px-4 py-2.5 hover:border-sera-forest">
            <span className="rounded-lg bg-sera-forest px-2 py-1 text-sm font-bold text-white">{rating.toFixed(1)}</span>
            <span className="flex flex-col">
              <Stars rating={Math.round(rating)} />
              <span className="text-xs text-sera-muted">
                {reviews.length} guest {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </span>
          </a>
        )}
      </div>

      <div className="grid h-64 gap-2 overflow-hidden rounded-3xl sm:h-[420px] md:grid-cols-4 md:grid-rows-2">
        {images.slice(0, 5).map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={i === 0 ? hotel.name : `${hotel.name} photo ${i + 1}`}
            className={`h-full w-full object-cover ${i === 0 ? "md:col-span-2 md:row-span-2" : "hidden md:block"}`}
          />
        ))}
      </div>

      <HotelDetailClient hotel={JSON.parse(JSON.stringify(hotel))}>
        {reviews.length > 0 && (
          <section id="hotel-reviews-section" className="scroll-mt-24 space-y-4">
            <h2 className="font-display text-2xl text-sera-ink">Guest reviews</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.map((review: any) => (
                <div key={review._id?.toString()} className="review-item rounded-2xl border border-sera-line bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sera-mint text-sm font-bold text-sera-forest">
                        {review.reviewerName.charAt(0)}
                      </span>
                      <p className="font-semibold text-sera-ink">{review.reviewerName}</p>
                    </div>
                    <Stars rating={review.rating} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-sera-muted">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </HotelDetailClient>
    </div>
  );
}
