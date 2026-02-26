import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  addMenuItem,
  getRestaurantMenu,
  getOwnerMenu,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Restaurant owner adds menu item
router.post(
  "/",
  protect,
  authorizeRoles("restaurant_owner"),
  upload.single("image"),
  addMenuItem,
);

// Restaurant owner gets all their menu items (including unavailable)
router.get(
  "/owner",
  protect,
  authorizeRoles("restaurant_owner"),
  getOwnerMenu,
);

// Restaurant owner updates a menu item
router.put(
  "/:id",
  protect,
  authorizeRoles("restaurant_owner"),
  upload.single("image"),
  updateMenuItem,
);

// Restaurant owner deletes a menu item
router.delete(
  "/:id",
  protect,
  authorizeRoles("restaurant_owner"),
  deleteMenuItem,
);

// Customer views menu
router.get("/:restaurantId", getRestaurantMenu);

export default router;
