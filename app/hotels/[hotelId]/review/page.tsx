import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";
import { FALLBACK_HOTEL_IMAGE, formatStayDate } from "@/lib/constants";
import CheckoutSteps from "@/components/CheckoutSteps";
import GuestDetailsCard from "@/components/GuestDetailsCard";
import { applyTodaysOffer, getTodaysOffer } from "@/lib/todaysOffer";
import ReviewClient from "./ReviewClient";

export const dynamic = "force-dynamic";

export default async function BookingReviewPage({
  params,
  searchParams,
}: {
  params: { hotelId: string };
  searchParams: { roomTypeId?: string; checkIn?: string; checkOut?: string; guests?: string };
}) {
  const { hotelId } = params;
  const { roomTypeId, checkIn, checkOut, guests } = searchParams;

  if (!mongoose.isValidObjectId(hotelId)) redirect("/");

  await connectDB();
  const hotel = await Hotel.findById(hotelId).lean<any>();
  if (!hotel) redirect("/");

  const roomType = hotel.roomTypes.find((rt: any) => rt._id.toString() === roomTypeId);
  const guestsNum = Number(guests);

  // Defends against manual URL edits — a malformed/incomplete review link
  // sends the visitor back to pick a room and dates properly rather than
  // rendering a broken summary.
  const isValid =
    !!roomType &&
    !!checkIn &&
    !!checkOut &&
    new Date(checkOut) > new Date(checkIn) &&
    Number.isFinite(guestsNum) &&
    guestsNum >= 1;

  if (!isValid) redirect(`/hotels/${hotelId}`);

  const nights = Math.round(
    (new Date(checkOut!).getTime() - new Date(checkIn!).getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalAmount = nights * roomType.pricePerNight;
  // Same lookup POST /api/bookings does, so the price shown here is exactly
  // what the booking is created at, for whichever room was picked.
  const offer = await getTodaysOffer();
  const { discountAmount, payable } = applyTodaysOffer(totalAmount, offer);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-8 sm:px-6">
      <CheckoutSteps current={2} />
      <h1 className="font-display text-4xl text-sera-ink">Review your booking</h1>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-col overflow-hidden rounded-3xl border border-sera-line bg-white sm:flex-row">
            <img src={hotel.images?.[0] || FALLBACK_HOTEL_IMAGE} alt={hotel.name} className="h-44 w-full object-cover sm:h-auto sm:w-56" />
            <div className="space-y-1.5 p-6">
              <p className="text-xs font-semibold tracking-[0.2em] text-sera-brass">{hotel.city.toUpperCase()}</p>
              <h2 className="font-display text-2xl text-sera-ink">{hotel.name}</h2>
              <p className="font-semibold text-sera-ink">{roomType.name}</p>
              {hotel.address && <p className="text-sm text-sera-muted">{hotel.address}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-sera-line bg-sera-line sm:grid-cols-4">
            {[
              { label: "Check-in", value: formatStayDate(checkIn!) },
              { label: "Check-out", value: formatStayDate(checkOut!) },
              { label: "Nights", value: String(nights) },
              { label: "Guests", value: String(guestsNum) },
            ].map((item) => (
              <div key={item.label} className="bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-sera-muted">{item.label}</p>
                <p className="mt-1 font-semibold text-sera-ink">{item.value}</p>
              </div>
            ))}
          </div>

          <GuestDetailsCard />
        </div>

        <ReviewClient
          hotelId={hotelId}
          roomTypeId={roomType._id.toString()}
          roomTypeName={roomType.name}
          pricePerNight={roomType.pricePerNight}
          nights={nights}
          totalAmount={totalAmount}
          discountPercent={discountAmount > 0 ? offer!.discountPercent : 0}
          discountAmount={discountAmount}
          payable={payable}
          checkIn={checkIn!}
          checkOut={checkOut!}
          guests={guestsNum}
        />
      </div>
    </div>
  );
}
