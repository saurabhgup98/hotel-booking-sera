// Today's checkout discount. The brand will configure this inside APTI and
// this function will fetch it from there; until that API exists it's a fixed
// value. Read server-side only (review page + booking creation) so the price
// the guest pays never depends on anything the browser sends.
export type TodaysOffer = { discountPercent: number };

const FIXED_CHECKOUT_DISCOUNT_PERCENT = 4;

export async function getTodaysOffer(): Promise<TodaysOffer | null> {
  return { discountPercent: FIXED_CHECKOUT_DISCOUNT_PERCENT };
}

export function applyTodaysOffer(amount: number, offer: TodaysOffer | null) {
  const discountAmount = offer ? Math.round((amount * offer.discountPercent) / 100) : 0;
  return { discountAmount, payable: amount - discountAmount };
}
