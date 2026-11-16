import dotenv from "dotenv";
import mongoose from "mongoose";
import MenuItem from "../models/MenuItem.js";

dotenv.config();

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI, { dbName: "zomato" });
  const result = await MenuItem.updateMany(
    { category: { $in: ["veg", "non-veg"] } },
    [
      {
        $set: {
          isVeg: { $eq: ["$category", "veg"] },
          category: "other",
        },
      },
    ],
  );
  console.log(`Migrated ${result.modifiedCount} menu items.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Menu category migration failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
