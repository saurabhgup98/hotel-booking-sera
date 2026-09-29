import { Schema, model, models } from "mongoose";

// A discount code the hotel itself honours. The marketer creates the same
// code in APTI (which sends it to the guest on WhatsApp) and here, so the
// code the guest receives is the one this site validates and applies at the
// review step. Stored uppercase; lookups are case-insensitive via that.
const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Coupon || model("Coupon", couponSchema);
