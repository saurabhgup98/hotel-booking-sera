import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import PaymentForm from "./PaymentForm";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }: { params: { bookingId: string } }) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  // Defense in depth — middleware.ts already redirects unauthenticated
  // requests to /payment/* before this ever renders.
  if (!session) notFound();

  if (!mongoose.isValidObjectId(params.bookingId)) notFound();

  await connectDB();
  const booking = await Booking.findById(params.bookingId).lean<any>();
  if (!booking || booking.userId.toString() !== session.userId) notFound();

  if (booking.status !== "pending_payment") {
    redirect(`/booking/${params.bookingId}`);
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Complete your payment</h1>
      <div className="rounded-xl border bg-white p-4 text-sm shadow-sm">
        <p className="font-medium text-slate-900">
          {booking.hotelName} — {booking.roomTypeName}
        </p>
        <p className="mt-1 text-slate-600">
          {booking.nights} night(s) · {booking.guests} guest(s)
        </p>
        <p className="mt-1 font-semibold text-slate-900">Total: ₹{booking.totalAmount}</p>
      </div>
      <div className="rounded-2xl border bg-white p-6 shadow-md">
        <PaymentForm bookingId={params.bookingId} />
      </div>
    </div>
  );
}
