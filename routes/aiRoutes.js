import express from "express";
import { body, validationResult } from "express-validator";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import aiRateLimit from "../middleware/aiRateLimit.js";
import { chatWithMenu, createMenuDescription } from "../controllers/aiController.js";

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

router.post(
  "/menu-description",
  protect,
  authorizeRoles("restaurant_owner"),
  aiRateLimit,
  [
    body("name").isString().trim().isLength({ min: 1, max: 80 }),
    body("category").isString().trim().isLength({ min: 1, max: 40 }),
    body("price").optional({ nullable: true }).isFloat({ min: 0 }),
    body("isVeg").isBoolean(),
  ],
  validate,
  createMenuDescription,
);

router.post(
  "/chat",
  protect,
  authorizeRoles("customer"),
  aiRateLimit,
  [
    body("messages").isArray({ min: 1, max: 10 }),
    body("messages.*.role").isIn(["user", "assistant"]),
    body("messages.*.content").isString().trim().isLength({ min: 1, max: 500 }),
    body("pincode").optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
  ],
  validate,
  chatWithMenu,
);

export default router;
