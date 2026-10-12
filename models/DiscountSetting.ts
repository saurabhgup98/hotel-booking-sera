import { Schema, model, models } from "mongoose";
import { DISCOUNT_TYPES } from "@/lib/discount";

// The brand's discount for today — one document for the whole site (every
// visitor sees the same offer), changed through /api/discount.
//
//   todaysDiscount – advertised in the landing offer popup as "Up to …"
//   actualDiscount – what checkout really takes off, and what the WhatsApp
//                    offer message quotes
//
// Stays as set until changed again; it doesn't reset at midnight.
const discountSchema = new Schema(
  {
    type: { type: String, enum: DISCOUNT_TYPES, required: true },
    value: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const discountSettingSchema = new Schema(
  {
    // Always "current": a unique key keeps it to a single document.
    key: { type: String, required: true, unique: true, default: "current" },
    todaysDiscount: { type: discountSchema, required: true },
    actualDiscount: { type: discountSchema, required: true },
    // Credited to whoever referred a customer when that customer pays their
    // first booking (APTI does the crediting). Value 0 / unset = off.
    referralCashback: { type: discountSchema, required: false },
  },
  { timestamps: true }
);

export default models.DiscountSetting || model("DiscountSetting", discountSettingSchema);
