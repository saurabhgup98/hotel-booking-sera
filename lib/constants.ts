// Mocked OTP for this sandbox site — no real SMS is ever sent. Every request
// for an OTP "succeeds" and the one true code is always this value.
export const FIXED_OTP = "123456";

export const AUTH_COOKIE_NAME = "hb_session";

// localStorage key for the home page's search filters (check-in/out, guests,
// location). Deliberately persisted client-side rather than in React state
// so it survives navigating to a hotel page and back, and a full page
// refresh — cleared only by the "Clear filters" button or on logout.
export const HOME_FILTERS_STORAGE_KEY = "hb_home_filters";

// localStorage key for the landing-page offer lead (name, WhatsApp number,
// stay details) plus two once-per-day markers: `offerSeenOn` (the date the
// "Today's Offer" popup was last acknowledged) and `couponSentOn` (the date
// the first room "Book Now" last sent the WhatsApp offer).
// Deliberately NOT cleared on logout — it belongs to the visitor/browser, not
// the login session. See components/OfferFlow.tsx.
export const OFFER_LEAD_STORAGE_KEY = "sera_offer_lead";

// Window event fired after the offer form writes HOME_FILTERS_STORAGE_KEY, so
// an already-mounted home-page filter form re-reads it and shows the values.
export const FILTERS_UPDATED_EVENT = "sera:filters-updated";

// Window event fired whenever the visitor's stay dates change on the page
// (home filters or a hotel's stay card), detail = StayDetails. The offer flow
// uses it to decide which version of the offer form to show, and when, and
// to fill in the stay details the shorter versions don't ask for.
export const STAY_DATES_CHANGED_EVENT = "sera:stay-dates-changed";

export type StayDetails = { checkIn: string; checkOut: string; guests?: string; location?: string };

export function announceStayDates(stay: StayDetails) {
  window.dispatchEvent(new CustomEvent<StayDetails>(STAY_DATES_CHANGED_EVENT, { detail: stay }));
}

// What kind of stay a property is — shown on cards and the detail page, and
// used by the home-page category filter. Properties saved before this field
// existed count as hotels.
export const PROPERTY_TYPES = ["Hotel", "Resort", "Vacation Home"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export const DEFAULT_PROPERTY_TYPE: PropertyType = "Hotel";

// Room photos are keyed by room type name (every hotel has the same two room
// types), so they don't have to be stored on each embedded roomType document.
export const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

export const ROOM_TYPE_IMAGES: Record<string, string> = {
  "Deluxe Room": unsplash("1618773928121-c32242e63f39"),
  "Executive Suite": unsplash("1590490360182-c33d57733427"),
  // Vacation home units
  "Two-Bedroom Cottage": unsplash("1445019980597-93fa8acb246c"),
  "Entire Villa": unsplash("1566073771259-6a8506099945"),
};

export const HERO_IMAGE = unsplash("1520250497591-112f2f40a3f4", 2000);
export const FALLBACK_HOTEL_IMAGE = unsplash("1542314831-068cd1dbfeeb");

export function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Mock-payment decision lists. A UPI ID typed at checkout is matched
// (case-insensitively, trimmed) against these two lists to deterministically
// produce a success or failure outcome, so testers can trigger either case
// on demand. Any UPI ID NOT in either list defaults to "approved" — this is
// a deliberate choice to keep the happy path frictionless; testers who want
// the failure path must intentionally type one of REJECT_UPI_IDS.
export const APPROVE_UPI_IDS = ["success@upi", "approve@oksbi", "testpass@ybl"];
export const REJECT_UPI_IDS = ["failure@upi", "reject@oksbi", "testfail@ybl"];

export function decidePaymentOutcome(upiId: string): "approved" | "rejected" {
  const value = upiId.trim().toLowerCase();
  if (REJECT_UPI_IDS.includes(value)) return "rejected";
  if (APPROVE_UPI_IDS.includes(value)) return "approved";
  return "approved"; // documented default — see note above
}

// "9876543210" → "+91 98765 43210"; anything that isn't a plain 10-digit
// Indian number (optionally already prefixed with 91) is shown as entered.
export function formatMobile(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return mobile;
}

// "2026-10-12" (or a Date) → "Mon, 12 Oct 2026". Date-only strings are
// parsed as local dates so the day never shifts across timezones.
export function formatStayDate(value: string | Date, withYear = true) {
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}
