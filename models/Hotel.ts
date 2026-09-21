import { Schema, model, models } from "mongoose";

const roomTypeSchema = new Schema(
  {
    name: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    capacity: { type: Number, required: true },
    description: { type: String, default: "" },
  },
  { _id: true }
);

const hotelSchema = new Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    roomTypes: { type: [roomTypeSchema], default: [] },
  },
  { timestamps: true }
);

export default models.Hotel || model("Hotel", hotelSchema);
