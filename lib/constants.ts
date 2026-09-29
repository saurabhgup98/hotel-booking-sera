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
// stay details) plus the flags that make the offer flow once-per-visitor:
// `offerSeen` (the "Today's Offer" popup was acknowledged) and `couponSent`
// (the first room "Book Now" already showed the "check your WhatsApp" popup).
// Deliberately NOT cleared on logout — it belongs to the visitor/browser, not
// the login session. See components/OfferFlow.tsx.
export const OFFER_LEAD_STORAGE_KEY = "sera_offer_lead";

// Window event fired after the offer form writes HOME_FILTERS_STORAGE_KEY, so
// an already-mounted home-page filter form re-reads it and shows the values.
export const FILTERS_UPDATED_EVENT = "sera:filters-updated";

// Discount advertised in the "Today's Offer" popup. Display-only: the real
// discount comes from the Coupon collection when a code is applied at review
// (the marketer creates the same code in APTI, which sends it on WhatsApp).
export const OFFER_DISCOUNT_PERCENT = 5;

// Room photos are keyed by room type name (every hotel has the same two room
// types), so they don't have to be stored on each embedded roomType document.
export const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

export const ROOM_TYPE_IMAGES: Record<string, string> = {
  "Deluxe Room": unsplash("1618773928121-c32242e63f39"),
  "Executive Suite": unsplash("1590490360182-c33d57733427"),
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
