// A discount is either a percentage of the stay price or a flat rupee amount.
// Shared by the server (checkout maths, settings API) and the browser (offer
// popup), so nothing here may touch the database.
export const DISCOUNT_TYPES = ["percent", "amount"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];
export type Discount = { type: DiscountType; value: number };

// "5%" or "₹350"
export function formatDiscount(discount: Discount) {
  return discount.type === "percent"
    ? `${discount.value}%`
    : `₹${discount.value.toLocaleString("en-IN")}`;
}

// Rupees taken off `amount`. A flat amount never exceeds the price itself.
export function discountOn(amount: number, discount: Discount | null) {
  if (!discount || discount.value <= 0) return 0;
  const off = discount.type === "percent" ? (amount * discount.value) / 100 : discount.value;
  return Math.min(amount, Math.round(off));
}
