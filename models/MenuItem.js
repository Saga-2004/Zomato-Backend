import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    image: {
      type: String,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    // Single price (for backward compatibility), or use variants
    price: {
      type: Number,
      required: function () {
        // Only require price if variants is empty or not present
        return !this.variants || this.variants.length === 0;
      },
    },

    // Variants: array of { name, price }
    variants: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("MenuItem", menuItemSchema);
