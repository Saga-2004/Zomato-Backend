import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  addToCart,
  checkout,
  getCart,
  removeFromCart,
  getCartSummary,
} from "../controllers/cartController.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

const customerOnly = [protect, authorizeRoles("customer")];

router.post("/", ...customerOnly, addToCart);
router.get("/", ...customerOnly, getCart);
router.delete("/:itemId", ...customerOnly, removeFromCart);
router.post("/checkout", ...customerOnly, checkout);
router.post("/summary", ...customerOnly, getCartSummary);

export default router;
