import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { createCoupon, getMyCoupons } from "../controllers/couponController.js";

const router = express.Router();

// Restaurant owner creates coupon
router.post("/", protect, authorizeRoles("restaurant_owner"), createCoupon);

// Restaurant owner lists their coupons
router.get("/mine", protect, authorizeRoles("restaurant_owner"), getMyCoupons);

export default router;
