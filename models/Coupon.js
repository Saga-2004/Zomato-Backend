import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
    },

    discountPercent: {
      type: Number,
      required: true,
    },

    maxDiscount: {
      type: Number,
      required: true,
    },

    validTill: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Coupon", couponSchema);
