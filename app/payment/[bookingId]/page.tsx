import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME, formatINR, formatStayDate } from "@/lib/constants";
import CheckoutSteps from "@/components/CheckoutSteps";
import SeraLogo from "@/components/SeraLogo";
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

  const originalAmount = booking.originalAmount ?? booking.totalAmount;
  const bookingRef = `SH-${params.bookingId.slice(-6).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pt-8 sm:px-6">
      <CheckoutSteps current={3} />

      <div className="grid overflow-hidden rounded-3xl border border-sera-line bg-white shadow-2xl shadow-black/10 md:grid-cols-[300px_1fr]">
        <div className="flex flex-col justify-between gap-8 bg-sera-forest-dark p-7 text-white">
          <div className="space-y-6">
            <SeraLogo inverted />
            <div className="space-y-1 text-sm text-white/80">
              <p className="font-semibold text-white">{booking.hotelName}</p>
              <p>{booking.roomTypeName}</p>
              <p>
                {formatStayDate(booking.checkIn, false)} – {formatStayDate(booking.checkOut, false)} · {booking.nights}{" "}
                {booking.nights === 1 ? "night" : "nights"} · {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
              </p>
              <p className="pt-1 text-xs text-white/60">Booking ref {bookingRef}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.18em] text-white/70">AMOUNT PAYABLE</p>
            <p id="payment-amount" className="text-4xl font-bold tabular-nums">
              {formatINR(booking.totalAmount)}
            </p>
            {booking.discountAmount > 0 && (
              <p className="text-sm text-white/80">
                <span className="line-through">{formatINR(originalAmount)}</span>{" "}
                <span className="font-semibold text-[#9FE0BC]">
                  {booking.couponCode
                    ? `${booking.couponCode} saved you ${formatINR(booking.discountAmount)}`
                    : `${booking.discountLabel ?? `${booking.discountPercent}% off`} · you save ${formatINR(booking.discountAmount)}`}
                </span>
              </p>
            )}
            <p className="flex items-center gap-1.5 pt-6 text-xs text-white/70">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Secured, encrypted payment
            </p>
          </div>
        </div>

        <PaymentForm bookingId={params.bookingId} amount={booking.totalAmount} />
      </div>
    </div>
  );
}
