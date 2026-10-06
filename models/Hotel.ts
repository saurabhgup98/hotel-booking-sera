import { Schema, model, models } from "mongoose";
import { DEFAULT_PROPERTY_TYPE, PROPERTY_TYPES } from "../lib/constants";

const roomTypeSchema = new Schema(
  {
    name: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    capacity: { type: Number, required: true },
    description: { type: String, default: "" },
  },
  { _id: true }
);

const reviewSchema = new Schema(
  {
    reviewerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { _id: true }
);

const hotelSchema = new Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    propertyType: { type: String, enum: [...PROPERTY_TYPES], default: DEFAULT_PROPERTY_TYPE },
    description: { type: String, default: "" },
    address: { type: String, default: "" },
    // First image is the cover (home card + gallery hero).
    images: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    roomTypes: { type: [roomTypeSchema], default: [] },
    reviews: { type: [reviewSchema], default: [] },
  },
  { timestamps: true }
);

export default models.Hotel || model("Hotel", hotelSchema);
