import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { getCashbackBalance, releaseCashback, reserveCashback } from "@/lib/aptiCashback";

// Referral cashback on an unpaid booking (payment page).
//   POST    apply: APTI holds the customer's whole available balance (whole
//           rupees), capped so at least ₹1 is still paid; the payable drops by it.
//   DELETE  remove: APTI releases the hold; the payable goes back.
// The amount always comes from APTI and the booking — never from the browser.

export const dynamic = "force-dynamic";

// Something is always paid, so the payment step still makes sense.
const MIN_PAYABLE = 1;

async function loadUnpaidBooking(bookingId: string) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  if (!mongoose.isValidObjectId(bookingId)) {
    return { error: NextResponse.json({ error: "Booking not found" }, { status: 404 }) };
  }

  await connectDB();
  const booking = await Booking.findById(bookingId);
  if (!booking || booking.userId.toString() !== session.userId) {
    return { error: NextResponse.json({ error: "Booking not found" }, { status: 404 }) };
  }
  if (booking.status !== "pending_payment") {
    return { error: NextResponse.json({ error: "Booking is not awaiting payment" }, { status: 409 }) };
  }
  return { session, booking };
}

export async function POST(_request: Request, { params }: { params: { bookingId: string } }) {
  const loaded = await loadUnpaidBooking(params.bookingId);
  if (loaded.error) return loaded.error;
  const { session, booking } = loaded;

  // Price after today's discount, before any cashback.
  const beforeCashback = booking.amountBeforeCashback ?? booking.totalAmount;
  const maxCashback = beforeCashback - MIN_PAYABLE;
  if (maxCashback <= 0) {
    return NextResponse.json({ error: "Nothing left to take cashback off" }, { status: 409 });
  }

  // Prices are whole rupees, so only whole rupees of the balance are applied
  // (APTI then holds exactly that much).
  const balance = await getCashbackBalance(session.mobile);
  const toApply = Math.min(Math.floor(balance.available), maxCashback);
  if (toApply <= 0) {
    return NextResponse.json({ error: "No cashback available to apply" }, { status: 409 });
  }

  const reserved = await reserveCashback(session.mobile, params.bookingId, toApply);
  if (!reserved.ok) {
    return NextResponse.json({ error: reserved.error }, { status: reserved.status === 409 || reserved.status === 404 ? 409 : 502 });
  }

  const cashback = Math.floor(reserved.data.amount);
  booking.amountBeforeCashback = beforeCashback;
  booking.cashbackAmount = cashback;
  booking.totalAmount = beforeCashback - cashback;
  await booking.save();
  return NextResponse.json({ cashbackAmount: cashback, totalAmount: booking.totalAmount });
}

export async function DELETE(_request: Request, { params }: { params: { bookingId: string } }) {
  const loaded = await loadUnpaidBooking(params.bookingId);
  if (loaded.error) return loaded.error;
  const { booking } = loaded;

  if (booking.cashbackAmount > 0) {
    const released = await releaseCashback(params.bookingId);
    // Already released / never reached APTI: the price goes back either way
    // (an unconfirmed hold also lapses on its own).
    if (!released.ok && released.status !== 404 && released.status !== 409) {
      return NextResponse.json({ error: released.error }, { status: 502 });
    }
  }
  booking.totalAmount = booking.amountBeforeCashback ?? booking.totalAmount;
  booking.cashbackAmount = 0;
  await booking.save();
  return NextResponse.json({ cashbackAmount: 0, totalAmount: booking.totalAmount });
}
