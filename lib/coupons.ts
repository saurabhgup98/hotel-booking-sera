import Coupon from "@/models/Coupon";

export type AppliedCoupon = { code: string; discountPercent: number; discountAmount: number };

// Single source of truth for coupon maths — used by the validate endpoint
// (to preview the discount on the review page) and again by booking creation
// (which never trusts a client-computed amount). Returns null for an unknown
// or inactive code. Expects connectDB() to have been called.
export async function applyCoupon(rawCode: string, amount: number): Promise<AppliedCoupon | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  const coupon = await Coupon.findOne({ code, active: true }).lean<any>();
  if (!coupon) return null;
  return {
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    discountAmount: Math.round((amount * coupon.discountPercent) / 100),
  };
}
