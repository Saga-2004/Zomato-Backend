import express from "express";
import { createRestaurant } from "../controllers/restaurantController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Only admin can create restaurant
router.post("/", protect, authorizeRoles("admin"), createRestaurant);

export default router;
