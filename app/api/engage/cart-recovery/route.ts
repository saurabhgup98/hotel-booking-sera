import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { guestName, sendCartRecovery } from "@/lib/aptiEngage";

// The payment page has been open 25 seconds without paying: ask APTI for the
// cart recovery WhatsApp (lib/aptiEngage.ts) to the logged-in customer's
// number. The booking and number come from the server, never the request;
// APTI sends it at most once per customer per day.

export const dynamic = "force-dynamic";

const schema = z.object({
  bookingId: z.string().refine((id) => mongoose.isValidObjectId(id)),
});

export async function POST(request: Request) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ sent: false, reason: "Not signed in" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ sent: false, reason: "Invalid request" }, { status: 400 });
  }

  await connectDB();
  const booking = await Booking.findById(parsed.data.bookingId).lean<any>();
  if (!booking || booking.userId.toString() !== session.userId) {
    return NextResponse.json({ sent: false, reason: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "pending_payment") {
    return NextResponse.json({ sent: false, reason: "Booking is not awaiting payment" });
  }

  return NextResponse.json(await sendCartRecovery(booking, session.mobile, await guestName(session.userId)));
}
