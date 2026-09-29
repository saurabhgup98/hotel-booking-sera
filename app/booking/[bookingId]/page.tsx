import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME, formatINR, formatStayDate } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function BookingResultPage({ params }: { params: { bookingId: string } }) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) notFound();

  if (!mongoose.isValidObjectId(params.bookingId)) notFound();

  await connectDB();
  const booking = await Booking.findById(params.bookingId).lean<any>();
  if (!booking || booking.userId.toString() !== session.userId) notFound();

  const bookingRef = `SH-${params.bookingId.slice(-6).toUpperCase()}`;
  const originalAmount = booking.originalAmount ?? booking.totalAmount;

  const rows: { label: string; value: string }[] = [
    { label: "Booking ref", value: bookingRef },
    { label: "Hotel", value: booking.hotelName },
    { label: "Room", value: booking.roomTypeName },
    { label: "Check-in", value: formatStayDate(booking.checkIn) },
    { label: "Check-out", value: formatStayDate(booking.checkOut) },
    {
      label: "Guests",
      value: `${booking.guests} ${booking.guests === 1 ? "guest" : "guests"} · ${booking.nights} ${booking.nights === 1 ? "night" : "nights"}`,
    },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 pt-10 sm:px-6">
      {booking.status === "confirmed" && (
        <div id="booking-confirmed-banner" className="rounded-3xl border border-sera-line bg-white p-8 text-center shadow-xl shadow-black/5">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sera-mint text-sera-forest">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <h1 className="mt-5 font-display text-3xl text-sera-ink">Booking confirmed</h1>
          <p className="mt-2 text-sera-muted">
            Your stay at <span className="font-semibold text-sera-ink">{booking.hotelName}</span> is booked. We look
            forward to hosting you.
          </p>
        </div>
      )}
      {booking.status === "payment_failed" && (
        <div id="payment-failed-banner" className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl shadow-black/5">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </span>
          <h1 className="mt-5 font-display text-3xl text-sera-ink">Payment failed</h1>
          <p className="mt-2 text-sera-muted">Please try again with a different UPI ID.</p>
        </div>
      )}
      {booking.status === "pending_payment" && (
        <div className="rounded-3xl border border-sera-line bg-white p-6 text-center">
          <p className="text-sera-muted">This booking is still awaiting payment.</p>
          <Link href={`/payment/${params.bookingId}`} className="mt-3 inline-block font-semibold text-sera-forest hover:underline">
            Complete payment →
          </Link>
        </div>
      )}

      <div className="rounded-3xl border border-sera-line bg-white p-6">
        <dl className="space-y-3 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4">
              <dt className="text-sera-muted">{row.label}</dt>
              <dd className="text-right font-semibold text-sera-ink">{row.value}</dd>
            </div>
          ))}
          {booking.couponCode && booking.discountAmount > 0 && (
            <div className="flex justify-between gap-4 text-[#1F7A45]">
              <dt>Coupon {booking.couponCode}</dt>
              <dd className="font-semibold">
                −{formatINR(booking.discountAmount)} <span className="font-normal text-sera-muted line-through">{formatINR(originalAmount)}</span>
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-sera-line pt-3">
            <dt className="font-semibold text-sera-ink">{booking.status === "confirmed" ? "Paid" : "Total"}</dt>
            <dd className="text-lg font-bold text-sera-ink">{formatINR(booking.totalAmount)}</dd>
          </div>
          {booking.upiId && (
            <div className="flex justify-between gap-4">
              <dt className="text-sera-muted">UPI ID used</dt>
              <dd className="text-right text-sera-muted">{booking.upiId}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/bookings" className="flex-1 rounded-xl bg-sera-forest py-3 text-center text-sm font-semibold text-white hover:bg-sera-forest-dark">
          View my bookings
        </Link>
        <Link href="/" className="flex-1 rounded-xl border border-sera-line bg-white py-3 text-center text-sm font-semibold text-sera-ink hover:border-sera-forest">
          Back to home
        </Link>
      </div>
    </div>
  );
}
