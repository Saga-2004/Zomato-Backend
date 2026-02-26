import express from "express";
import multer from "multer";
import upload from "../middleware/uploadMiddleware.js"; // adjust path if needed
import {
  createRestaurant,
  getRestaurants,
} from "../controllers/restaurantController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Only admin can create restaurant
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  createRestaurant,
);

router.get("/", getRestaurants);

export default router;
