import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

// Admin creates restaurant
export const createRestaurant = async (req, res) => {
  // console.log(req.body);

  try {
    const {
      restaurant_name,
      restaurant_address,
      restaurant_contact,
      ownerId,
      restaurant_deliveryPincodes,
      preparationTime,
    } = req.body;

    if (!ownerId) {
      return res.status(400).json({ message: "OwnerID is required" });
    }

    if (!restaurant_name || !restaurant_address || !restaurant_contact) {
      return res
        .status(400)
        .json({ message: "Name, address and contact are required" });
    }

    // Check owner exists
    const owner = await User.findById(ownerId);

    if (!owner) {
      return res
        .status(404)
        .json({ message: "Owner not found. Please check ownerID again." });
    }

    // Change role to restaurant owner
    owner.role = "restaurant_owner";
    await owner.save();

    // Optional image upload
    let imageUrl = "";
    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path);
      imageUrl = uploadRes.secure_url;
    }

    // Normalize pincodes: accept comma-separated string or array
    let pincodeArray = [];
    if (typeof restaurant_deliveryPincodes === "string") {
      pincodeArray = restaurant_deliveryPincodes
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    } else if (Array.isArray(restaurant_deliveryPincodes)) {
      pincodeArray = restaurant_deliveryPincodes.map((p) => String(p).trim());
    }

    const restaurant = await Restaurant.create({
      ownerId: ownerId,
      image: imageUrl,
      restaurant_name,
      restaurant_address,
      restaurant_contact,
      restaurant_deliveryPincodes: pincodeArray,
      preparationTime:
        typeof preparationTime === "number"
          ? preparationTime
          : preparationTime
            ? Number(preparationTime)
            : undefined,
    });

    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// All restaurant details
export const getRestaurants = async (req, res) => {
  try {
    const { pincode } = req.query;

    let filter = {};

    if (pincode) {
      filter.restaurant_deliveryPincodes = pincode;
    }

    const restaurants = await Restaurant.find(filter);

    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
