import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["customer", "admin", "restaurant_owner", "delivery_partner"],
      default: "customer",
    },
    // savedAddresses: [addressSchema],
    isBlocked: { type: Boolean, default: false }, // For Admin control
    availabilityStatus: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    }, // For delivery partners
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
