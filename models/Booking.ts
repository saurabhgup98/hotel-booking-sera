import { Schema, model, models } from "mongoose";

export const BOOKING_STATUSES = [
  "pending_payment",
  "confirmed",
  "payment_failed",
  "cancelled",
] as const;

const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hotelId: { type: Schema.Types.ObjectId, ref: "Hotel", required: true },
    roomTypeId: { type: Schema.Types.ObjectId, required: true },
    // Denormalized for convenience so the booking-history/result pages don't
    // need an extra populate() — acceptable for a throwaway sandbox dataset
    // that's never edited after seeding.
    hotelName: { type: String, required: true },
    roomTypeName: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true },
    nights: { type: Number, required: true },
    // totalAmount is what the guest actually pays (after today's checkout
    // discount, see lib/todaysOffer.ts); originalAmount is nights × price
    // before it. Older bookings have no originalAmount — treat it as
    // totalAmount. couponCode is only set on bookings from the earlier
    // coupon-code flow.
    totalAmount: { type: Number, required: true },
    originalAmount: { type: Number },
    couponCode: { type: String },
    discountPercent: { type: Number },
    // How the discount reads, e.g. "4% off" or "₹350 off" (today's discount
    // can be a percent or a flat amount). Older bookings only have
    // discountPercent.
    discountLabel: { type: String },
    discountAmount: { type: Number, default: 0 },
    status: { type: String, enum: BOOKING_STATUSES, default: "pending_payment" },
    upiId: { type: String },
    paymentResult: { type: String, enum: ["approved", "rejected", "pending"], default: "pending" },
  },
  { timestamps: true }
);

export default models.Booking || model("Booking", bookingSchema);
