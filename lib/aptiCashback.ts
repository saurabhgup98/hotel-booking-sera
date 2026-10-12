// APTI referral cashback, server-side only (the secret key never reaches the
// browser). APTI keeps the customers, referrals and balances — it learns
// them from the SDK (login_success, payment_completed). The site only:
//   - shows a customer's balance and referral id (My Bookings, payment page)
//   - holds the balance on a booking when they tap Apply   (reserve)
//   - marks it used once paid, or gives it back            (confirm / release)
//
// APTI's base URL comes from APTI_TRACK_URL (…/sdk/v1/track). With it or
// APTI_SECRET_KEY unset, cashback is simply off: balance 0, nothing applied.

const TIMEOUT_MS = 6000;

export type CashbackBalance = {
  found: boolean;
  referralId: string | null;
  available: number;
  pending: number;
};

export type CashbackResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

function aptiBase() {
  const trackUrl = process.env.APTI_TRACK_URL;
  return trackUrl ? trackUrl.replace(/\/sdk\/v1\/track\/?$/, "") : null;
}

async function call<T>(path: string, body: object): Promise<CashbackResult<T>> {
  const base = aptiBase();
  const key = process.env.APTI_SECRET_KEY;
  if (!base || !key) return { ok: false, status: 503, error: "Cashback is not set up yet" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/sdk/v1/cashback/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-apti-key": key },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, status: res.status, error: json?.error?.msg || `APTI returned ${res.status}` };
    }
    return { ok: true, data: json?.data as T };
  } catch (err) {
    console.error(`[aptiCashback] ${path} failed`, err);
    return { ok: false, status: 502, error: "Could not reach APTI" };
  } finally {
    clearTimeout(timer);
  }
}

const NO_BALANCE: CashbackBalance = { found: false, referralId: null, available: 0, pending: 0 };

/** The logged-in customer's balance; zero (never an error) if unavailable. */
export async function getCashbackBalance(mobile: string): Promise<CashbackBalance> {
  const result = await call<{ found: boolean; referral_id: string | null; available: number; pending: number }>(
    "balance",
    { mobile }
  );
  if (!result.ok) return NO_BALANCE;
  return {
    found: result.data.found,
    referralId: result.data.referral_id,
    available: result.data.available,
    pending: result.data.pending,
  };
}

/** Holds the whole available balance on a booking, at most `maxAmount`. */
export function reserveCashback(mobile: string, bookingId: string, maxAmount: number) {
  return call<{ amount: number; expires_at: string }>("reserve", { mobile, booking_id: bookingId, max_amount: maxAmount });
}

export function confirmCashback(bookingId: string) {
  return call<{ amount: number; status: string }>("confirm", { booking_id: bookingId });
}

export function releaseCashback(bookingId: string) {
  return call<{ amount: number; status: string }>("release", { booking_id: bookingId });
}
