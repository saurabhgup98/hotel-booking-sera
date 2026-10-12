import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { verifySession } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { getPropertyType } from "@/lib/propertyType";
import { guestName, sendCartRecovery } from "@/lib/aptiEngage";

// Tells APTI a checkout was abandoned: the payment page sends a beacon here
// when it is closed (tab / browser closed, or a full reload) while the
// booking is still unpaid. Sent on to APTI's POST /sdk/v1/track as
// `payment_abandoned` with the SDK's visitor + visit ids, so APTI links it to
// the same browser, and counts the checkout as abandoned right away.
//
// Server-side so the secret key never reaches the browser, and so the amount
// and property come from the booking itself, never from the request. A
// reload that later pays in the same visit isn't counted by APTI.
//
// It also asks APTI for the cart recovery WhatsApp (lib/aptiEngage.ts) —
// APTI sends it at most once per customer per day, so this and the payment
// page's 25-second timer can both ask.
//
// With APTI_TRACK_URL or APTI_SECRET_KEY unset the call is skipped.

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 5000;

const schema = z.object({
  bookingId: z.string().refine((id) => mongoose.isValidObjectId(id)),
  visitorId: z.string().trim().min(1).max(255).optional(),
  sessionId: z.string().trim().min(1).max(255).optional(),
});

export async function POST(request: Request) {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ sent: false, reason: "Not signed in" }, { status: 401 });
  }

  // sendBeacon posts text/plain, so parse the body ourselves.
  let body: unknown = null;
  try {
    body = JSON.parse(await request.text());
  } catch {}
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ sent: false, reason: "Invalid request" }, { status: 400 });
  }

  const url = process.env.APTI_TRACK_URL;
  const apiKey = process.env.APTI_SECRET_KEY;
  if (!url || !apiKey) {
    return NextResponse.json({ sent: false, reason: "APTI tracking is not configured yet" });
  }

  await connectDB();
  const booking = await Booking.findById(parsed.data.bookingId).lean<any>();
  if (!booking || booking.userId.toString() !== session.userId) {
    return NextResponse.json({ sent: false, reason: "Booking not found" }, { status: 404 });
  }
  // Paid (or cancelled) in the meantime — nothing was abandoned.
  if (booking.status !== "pending_payment") {
    return NextResponse.json({ sent: false, reason: "Booking is not awaiting payment" });
  }

  const payload = {
    event: "payment_abandoned",
    order_id: String(booking._id),
    value: booking.totalAmount,
    category: await getPropertyType(booking.hotelId),
    property_name: booking.hotelName,
    visitor_id: parsed.data.visitorId,
    session_id: parsed.data.sessionId,
    occurred_at: new Date().toISOString(),
  };

  // Runs alongside the event; awaited before responding (the function stops then).
  const recovery = guestName(session.userId)
    .then((name) => sendCartRecovery(booking, session.mobile, name))
    .catch((err) => {
      console.error("[track/payment-abandoned] cart recovery failed", err);
    });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-apti-key": apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("[track/payment-abandoned] APTI refused the event", res.status, data);
      return NextResponse.json({ sent: false, reason: `APTI returned ${res.status}` }, { status: 502 });
    }
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[track/payment-abandoned] Could not reach APTI", err);
    return NextResponse.json({ sent: false, reason: "Could not reach APTI" }, { status: 502 });
  } finally {
    clearTimeout(timer);
    await recovery;
  }
}
