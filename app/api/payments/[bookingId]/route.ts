import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME, BOOKING_CONFIRMED_WHATSAPP_ENABLED, decidePaymentOutcome } from "@/lib/constants";
import { confirmCashback, releaseCashback } from "@/lib/aptiCashback";
import { getReferralCashback } from "@/lib/todaysOffer";
import { guestName, sendBookingConfirmed } from "@/lib/aptiEngage";

export const dynamic = "force-dynamic";

const schema = z.object({
  upiId: z.string().trim().min(3),
});

export async function POST(request: Request, { params }: { params: { bookingId: string } }) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!mongoose.isValidObjectId(params.bookingId)) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "UPI ID is required" }, { status: 400 });
  }

  await connectDB();
  const booking = await Booking.findById(params.bookingId);
  if (!booking || booking.userId.toString() !== session.userId) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "pending_payment") {
    return NextResponse.json({ error: "Booking is not awaiting payment" }, { status: 409 });
  }

  const outcome = decidePaymentOutcome(parsed.data.upiId);
  booking.upiId = parsed.data.upiId;
  booking.paymentResult = outcome;
  booking.status = outcome === "approved" ? "confirmed" : "payment_failed";
  if (outcome === "approved") {
    const rule = await getReferralCashback();
    if (rule) booking.referralCashback = rule;
  }
  await booking.save();

  // Referral cashback held on this booking: used now it's paid, given back if
  // not. A failure here doesn't undo the payment (an unconfirmed hold lapses).
  if (booking.cashbackAmount > 0) {
    const result = outcome === "approved" ? await confirmCashback(params.bookingId) : await releaseCashback(params.bookingId);
    if (!result.ok) console.error("[payments] cashback update failed", params.bookingId, result.error);
  }

  // Booking confirmed + refer-a-friend WhatsApp (APTI sends it once per
  // booking). Never undoes the payment if it fails. Switch:
  // BOOKING_CONFIRMED_WHATSAPP_ENABLED.
  if (outcome === "approved" && BOOKING_CONFIRMED_WHATSAPP_ENABLED) {
    const sent = await guestName(session.userId)
      .then((name) => sendBookingConfirmed(booking, session.mobile, name))
      .catch((err) => ({ sent: false, reason: String(err) }));
    if (!sent.sent) console.warn("[payments] booking confirmation WhatsApp not sent", params.bookingId, sent.reason);
  }

  return NextResponse.json({ bookingId: booking._id.toString(), status: booking.status });
}
