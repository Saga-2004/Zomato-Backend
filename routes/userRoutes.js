import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  updateAvailability,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/profile", protect, (req, res) => {
  res.json(req.user); //req.user get from authMiddleware
});

// Update availability status (primarily for delivery partners)
router.put("/profile/availability", protect, updateAvailability);

export default router;
