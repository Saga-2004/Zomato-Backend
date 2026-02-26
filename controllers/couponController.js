import Coupon from "../models/Coupon.js";
import Restaurant from "../models/Restaurant.js";

// Restaurant creates coupon
export const createCoupon = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const { code, discountPercent, maxDiscount, validTill } = req.body;

    const coupon = await Coupon.create({
      restaurant: restaurant._id,
      code,
      discountPercent,
      maxDiscount,
      validTill,
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get coupons for logged-in restaurant owner
export const getMyCoupons = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const coupons = await Coupon.find({ restaurant: restaurant._id });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
