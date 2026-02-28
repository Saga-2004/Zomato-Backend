import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  updateAvailability,
  updateProfile,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);

// Get current user profile
router.get("/profile", protect, (req, res) => {
  res.json(req.user); // req.user from authMiddleware (password excluded)
});

// Update profile (name / phone / address / saved addresses)
router.put("/profile", protect, updateProfile);

// Update availability status (primarily for delivery partners)
router.put("/profile/availability", protect, updateAvailability);

export default router;
