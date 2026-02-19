import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getAdminDashboard } from "../controllers/adminController.js";

const router = express.Router();

router.get("/dashboard", protect, authorizeRoles("admin"), getAdminDashboard);

export default router;
