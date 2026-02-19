import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";

dotenv.config(); // Load env vars
connectDB(); // Connect to database

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurants", restaurantRoutes);
``;

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
