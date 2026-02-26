import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getAdminDashboard,
  getAllOrders,
  toggleBlockUser,
  getAllUsers,
  getUserById,
  getUserOrders,
  getAdminAnalytics,
  refundOrder,
  updateOrderStatusAdmin,
  getDeliveryPartners,
  createDeliveryPartner,
  removeDeliveryPartner,
  toggleRestaurantOffers,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/dashboard", protect, authorizeRoles("admin"), getAdminDashboard);

// User management
router.get("/users", protect, authorizeRoles("admin"), getAllUsers);
router.get("/users/:id", protect, authorizeRoles("admin"), getUserById);
router.get(
  "/users/:id/orders",
  protect,
  authorizeRoles("admin"),
  getUserOrders,
);

router.put(
  "/users/:id/block",
  protect,
  authorizeRoles("admin"),
  toggleBlockUser,
);
router.patch(
  "/users/:id/block",
  protect,
  authorizeRoles("admin"),
  toggleBlockUser,
);

// Order control
router.get("/orders", protect, authorizeRoles("admin"), getAllOrders);
router.put(
  "/orders/:id/status",
  protect,
  authorizeRoles("admin"),
  updateOrderStatusAdmin,
);
router.put("/orders/:id/refund", protect, authorizeRoles("admin"), refundOrder);

router.get("/analytics", protect, authorizeRoles("admin"), getAdminAnalytics);

// Delivery partner management
router.get(
  "/delivery-partners",
  protect,
  authorizeRoles("admin"),
  getDeliveryPartners,
);
router.post(
  "/delivery-partners",
  protect,
  authorizeRoles("admin"),
  createDeliveryPartner,
);
router.delete(
  "/delivery-partners/:id",
  protect,
  authorizeRoles("admin"),
  removeDeliveryPartner,
);

// Offers management (enable / disable all coupons for a restaurant)
router.put(
  "/restaurants/:id/offers",
  protect,
  authorizeRoles("admin"),
  toggleRestaurantOffers,
);

export default router;
