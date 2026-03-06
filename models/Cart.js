import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  variantIdx: {
    type: Number,
    default: null,
  },
  variantName: {
    type: String,
    default: null,
  },
  price: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    items: [cartItemSchema],
  },
  { timestamps: true },
);

export default mongoose.model("Cart", cartSchema);
