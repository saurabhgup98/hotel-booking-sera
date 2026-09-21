import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME, decidePaymentOutcome } from "@/lib/constants";

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
  await booking.save();

  return NextResponse.json({ bookingId: booking._id.toString(), status: booking.status });
}
