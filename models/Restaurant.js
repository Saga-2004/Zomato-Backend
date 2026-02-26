import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      type: String,
    },
    restaurant_name: {
      type: String,
      required: true,
    },

    restaurant_address: {
      type: String,
      required: true,
    },

    restaurant_contact: {
      type: String,
    },

    restaurant_deliveryPincodes: [String],

    preparationTime: {
      type: Number,
      default: 30,
    },

    isOpen: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Restaurant", restaurantSchema);
