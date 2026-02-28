import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config(); // Load env vars

import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

connectDB(); // Connect to database

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // frontend URL
    credentials: true,
  }),
);

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/payment", paymentRoutes);

// Basic Route
app.get("/", (req, res) => {
  res.send("Zomato Clone API is running...");
});

app.listen(process.env.PORT, (err) => {
  if (err) {
    console.log("Error in Server Starting: ", err);
  } else {
    console.log("Server Running Successfully");
  }
});
