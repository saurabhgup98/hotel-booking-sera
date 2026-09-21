import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function BookingResultPage({ params }: { params: { bookingId: string } }) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) notFound();

  if (!mongoose.isValidObjectId(params.bookingId)) notFound();

  await connectDB();
  const booking = await Booking.findById(params.bookingId).lean<any>();
  if (!booking || booking.userId.toString() !== session.userId) notFound();

  return (
    <div className="mx-auto max-w-sm space-y-4">
      {booking.status === "confirmed" && (
        <div
          id="booking-confirmed-banner"
          className="rounded border border-green-600 bg-green-50 p-4 text-green-800"
        >
          <h1 className="font-bold">Booking Confirmed</h1>
          <p className="text-sm">
            {booking.hotelName} — {booking.roomTypeName}
          </p>
        </div>
      )}
      {booking.status === "payment_failed" && (
        <div id="payment-failed-banner" className="rounded border border-red-600 bg-red-50 p-4 text-red-800">
          <h1 className="font-bold">Payment Failed</h1>
          <p className="text-sm">Please try again with a different UPI ID.</p>
        </div>
      )}
      {booking.status === "pending_payment" && <p>This booking is still awaiting payment.</p>}

      <div className="rounded border bg-white p-4 text-sm">
        <p>
          {booking.hotelName} — {booking.roomTypeName}
        </p>
        <p>
          {new Date(booking.checkIn).toLocaleDateString()} → {new Date(booking.checkOut).toLocaleDateString()} (
          {booking.nights} nights)
        </p>
        <p className="mt-1 font-semibold">Total: ₹{booking.totalAmount}</p>
        {booking.upiId && <p className="text-xs text-gray-500">UPI ID used: {booking.upiId}</p>}
      </div>
    </div>
  );
}
