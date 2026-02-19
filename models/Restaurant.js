import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    contact: {
      type: String,
    },

    deliveryPincodes: [String],

    preparationTime: {
      type: Number,
      default: 30,
    },

    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Restaurant", restaurantSchema);
