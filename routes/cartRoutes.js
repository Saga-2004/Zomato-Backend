import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  addToCart,
  checkout,
  getCart,
  removeFromCart,
  getCartSummary,
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/", protect, addToCart);
router.get("/", protect, getCart);
router.delete("/:itemId", protect, removeFromCart);
router.post("/checkout", protect, checkout);
router.post("/summary", protect, getCartSummary);

export default router;
