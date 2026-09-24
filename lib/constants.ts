// Mocked OTP for this sandbox site — no real SMS is ever sent. Every request
// for an OTP "succeeds" and the one true code is always this value.
export const FIXED_OTP = "123456";

export const AUTH_COOKIE_NAME = "hb_session";

// localStorage key for the home page's search filters (check-in/out, guests,
// location). Deliberately persisted client-side rather than in React state
// so it survives navigating to a hotel page and back, and a full page
// refresh — cleared only by the "Clear filters" button or on logout.
export const HOME_FILTERS_STORAGE_KEY = "hb_home_filters";

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
