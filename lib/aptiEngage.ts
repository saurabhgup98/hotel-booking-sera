import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { formatINR } from "@/lib/constants";
import { formatDiscount, type Discount } from "@/lib/discount";
import { getTodaysOffer } from "@/lib/todaysOffer";

// APTI's WhatsApp messages at checkout moments, server-side only (the secret
// key never reaches the browser; the number is the logged-in customer's).
// APTI decides whether to send — once per customer per day for the cart
// recovery (never once paid), once per booking for the confirmation — so
// calling these twice is harmless.
//
//   cart recovery      payment page open 25 s without paying, or closed
//                      (hotel_cart_recovery: link back to the payment page)
//   booking confirmed  just paid (hotel_booking_confirmed_refer: book again /
//                      refer a friend from /refer/<referral id>) — switch:
//                      BOOKING_CONFIRMED_WHATSAPP_ENABLED
// Both greet the guest by the name from the offer form, when they gave one.
//
// With APTI_TRACK_URL or APTI_SECRET_KEY unset both are skipped.

const TIMEOUT_MS = 6000;

export type EngageResult = { sent: boolean; reason?: string };

/** APTI's API base, from APTI_TRACK_URL (…/sdk/v1/track); null when unset. */
export function aptiBase() {
  const trackUrl = process.env.APTI_TRACK_URL;
  return trackUrl ? trackUrl.replace(/\/sdk\/v1\/track\/?$/, "") : null;
}

async function call(path: string, body: object): Promise<EngageResult> {
  const base = aptiBase();
  const key = process.env.APTI_SECRET_KEY;
  if (!base || !key) return { sent: false, reason: "APTI is not set up yet" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/sdk/v1/engage/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-apti-key": key },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      console.error(`[aptiEngage] ${path} refused`, res.status, json?.error?.msg);
      return { sent: false, reason: json?.error?.msg || `APTI returned ${res.status}` };
    }
    return { sent: Boolean(json?.data?.sent), reason: json?.data?.reason };
  } catch (err) {
    console.error(`[aptiEngage] ${path} failed`, err);
    return { sent: false, reason: "Could not reach APTI" };
  } finally {
    clearTimeout(timer);
  }
}

// The fields of a booking these messages use.
type BookingInfo = {
  _id: unknown;
  hotelName: string;
  roomTypeName: string;
  checkIn: Date | string;
  checkOut: Date | string;
  discountLabel?: string;
  discountPercent?: number;
  discountAmount?: number;
  referralCashback?: { type?: string; value?: number } | null;
};

// "12 Oct 2026" (stay dates are stored as UTC midnights).
const dayLabel = (value: Date | string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** The guest's name from the offer form, if they gave one. */
export async function guestName(userId: string): Promise<string | undefined> {
  await connectDB();
  const user = await User.findById(userId).select("name").lean<{ name?: string }>();
  return user?.name || undefined;
}

// The discount on the booking, e.g. "10%" / "₹350"; today's offer if it has none.
async function bookingDiscount(booking: BookingInfo) {
  if (booking.discountLabel) return booking.discountLabel.replace(/\s*off$/i, "");
  if (booking.discountPercent) return `${booking.discountPercent}%`;
  if (booking.discountAmount && booking.discountAmount > 0) return formatINR(booking.discountAmount);
  return formatDiscount(await getTodaysOffer());
}

export async function sendCartRecovery(booking: BookingInfo, mobile: string, name?: string) {
  return call("cart-recovery", {
    mobile,
    booking_id: String(booking._id),
    customer_name: name,
    property_name: booking.hotelName,
    room_name: booking.roomTypeName,
    discount: await bookingDiscount(booking),
  });
}

/** Skipped while referral cashback is off — the message promises a cashback. */
export async function sendBookingConfirmed(booking: BookingInfo, mobile: string, name?: string) {
  const rule = booking.referralCashback;
  if (!rule?.value || rule.value <= 0) return { sent: false, reason: "Referral cashback is off" };
  return call("booking-confirmed", {
    mobile,
    booking_id: String(booking._id),
    customer_name: name,
    property_name: booking.hotelName,
    stay_dates: `${dayLabel(booking.checkIn)} - ${dayLabel(booking.checkOut)}`,
    cashback: formatDiscount({ type: rule.type === "amount" ? "amount" : "percent", value: rule.value } as Discount),
  });
}
