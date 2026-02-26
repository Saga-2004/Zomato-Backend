import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addRating } from "../controllers/ratingController.js";

const router = express.Router();

router.post("/", protect, addRating);

export default router;
