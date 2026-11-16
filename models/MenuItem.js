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
      trim: true,
    },
    isVeg: { type: Boolean, default: true },

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
    description: { type: String, maxlength: 300, trim: true },
    spiceLevel: {
      type: String,
      enum: ["mild", "medium", "spicy"],
      default: "mild",
    },
    tags: { type: [String], validate: [(value) => value.length <= 8, "Maximum 8 tags"] },
    allergens: {
      type: [String],
      validate: [(value) => value.length <= 8, "Maximum 8 allergens"],
    },
    aiGenerated: { type: Boolean, default: false },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

menuItemSchema.index({ restaurant: 1, isAvailable: 1 });
menuItemSchema.index({ isVeg: 1, isAvailable: 1 });
menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ name: "text", description: "text", tags: "text" });

export default mongoose.model("MenuItem", menuItemSchema);
