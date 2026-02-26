import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createOrder,
  getMyOrders,
  assignDeliveryPartner,
  getRestaurantOrders,
  updateOrderStatus,
  updateDeliveryStatus,
  getDeliveryOrders,
  getRestaurantAnalytics,
  claimDeliveryOrder,
} from "../controllers/orderController.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { cancelOrder } from "../controllers/orderController.js";

const router = express.Router();

//customer placed order
router.post("/", protect, createOrder);

//Users shows their placed orders.
router.get("/my-orders", protect, getMyOrders);

//Restaurant shows all their coming orders
router.get(
  "/restaurant",
  protect,
  authorizeRoles("restaurant_owner"),
  getRestaurantOrders,
);

//restaurant update order status
router.put(
  "/:id/status",
  protect,
  authorizeRoles("restaurant_owner"),
  updateOrderStatus,
);

router.get(
  "/restaurant/analytics",
  protect,
  authorizeRoles("restaurant_owner"),
  getRestaurantAnalytics,
);

router.put("/:id/cancel", protect, authorizeRoles("customer"), cancelOrder);

// Admin assigns delivery partner
router.put(
  "/:id/assign",
  protect,
  authorizeRoles("admin"),
  assignDeliveryPartner,
);

// Delivery partner gets assigned orders
router.get(
  "/delivery",
  protect,
  authorizeRoles("delivery_partner"),
  getDeliveryOrders,
);

// Delivery partner updates status
router.put(
  "/:id/delivery-status",
  protect,
  authorizeRoles("delivery_partner"),
  updateDeliveryStatus,
);

// Delivery partner claims a ready-for-pickup order
router.put(
  "/:id/claim",
  protect,
  authorizeRoles("delivery_partner"),
  claimDeliveryOrder,
);

export default router;
