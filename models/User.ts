import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    mobile: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default models.User || model("User", userSchema);
