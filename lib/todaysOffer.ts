import { connectDB } from "@/lib/db";
import DiscountSetting from "@/models/DiscountSetting";
import { discountOn, formatDiscount, type Discount } from "@/lib/discount";

// Today's discount, as set through /api/discount. Read server-side only
// (review page, booking creation, WhatsApp message) so the price the guest
// pays never depends on anything the browser sends.

export type DiscountSettingView = {
  todaysDiscount: Discount;
  actualDiscount: Discount;
  // null = off (never set, or 0)
  referralCashback: Discount | null;
  // true while nothing has been saved yet and the defaults below apply
  isDefault: boolean;
  updatedAt: string | null;
};

// Used until the brand saves a setting.
export const DEFAULT_TODAYS_DISCOUNT: Discount = { type: "percent", value: 5 };
export const DEFAULT_ACTUAL_DISCOUNT: Discount = { type: "percent", value: 4 };

const plain = (d: { type: Discount["type"]; value: number }): Discount => ({ type: d.type, value: d.value });

export async function getDiscountSetting(): Promise<DiscountSettingView> {
  await connectDB();
  const doc = await DiscountSetting.findOne({ key: "current" }).lean<any>();
  if (!doc) {
    return {
      todaysDiscount: DEFAULT_TODAYS_DISCOUNT,
      actualDiscount: DEFAULT_ACTUAL_DISCOUNT,
      referralCashback: null,
      isDefault: true,
      updatedAt: null,
    };
  }
  return {
    todaysDiscount: plain(doc.todaysDiscount),
    actualDiscount: plain(doc.actualDiscount),
    referralCashback: doc.referralCashback?.value > 0 ? plain(doc.referralCashback) : null,
    isDefault: false,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

// The discount checkout applies.
export async function getTodaysOffer(): Promise<Discount> {
  return (await getDiscountSetting()).actualDiscount;
}

// Today's referral cashback rule (null = off). Saved on a booking when it's
// paid, so the referrer gets the rule of that day.
export async function getReferralCashback(): Promise<Discount | null> {
  return (await getDiscountSetting()).referralCashback;
}

export function applyTodaysOffer(amount: number, offer: Discount | null) {
  const discountAmount = discountOn(amount, offer);
  return {
    discountAmount,
    payable: amount - discountAmount,
    // Shown on review / payment / booking pages, e.g. "4% off" or "₹350 off"
    label: offer && discountAmount > 0 ? `${formatDiscount(offer)} off` : null,
  };
}
