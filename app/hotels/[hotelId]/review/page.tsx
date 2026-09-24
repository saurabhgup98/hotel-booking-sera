import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Hotel from "@/models/Hotel";
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

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Review your booking</h1>
      <div className="rounded-xl border bg-white p-4 text-sm shadow-sm">
        <p className="font-medium text-slate-900">
          {hotel.name} — {roomType.name}
        </p>
        <p className="mt-1 text-slate-600">{hotel.city}</p>
        <p className="mt-2 text-slate-600">
          {new Date(checkIn!).toLocaleDateString()} → {new Date(checkOut!).toLocaleDateString()}
        </p>
        <p className="mt-1 text-slate-600">
          {nights} night(s) · {guestsNum} guest(s)
        </p>
        <p className="mt-2 font-semibold text-slate-900">Total: ₹{totalAmount}</p>
      </div>
      <ReviewClient
        hotelId={hotelId}
        roomTypeId={roomType._id.toString()}
        checkIn={checkIn!}
        checkOut={checkOut!}
        guests={guestsNum}
      />
    </div>
  );
}
