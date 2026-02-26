import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import cloudinary from "../config/cloudinary.js";

// Add menu item
export const addMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const { name, category, price, isAvailable } = req.body;

    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    const item = await MenuItem.create({
      restaurant: restaurant._id,
      name,
      category,
      price,
      image: imageUrl,
      isAvailable:
        typeof isAvailable === "string"
          ? isAvailable === "true"
          : Boolean(isAvailable),
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get restaurant menu (public, for customers)
export const getRestaurantMenu = async (req, res) => {
  try {
    const items = await MenuItem.find({
      restaurant: req.params.restaurantId,
      isAvailable: true,
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get menu for logged-in restaurant owner (all items, including unavailable)
export const getOwnerMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const items = await MenuItem.find({ restaurant: restaurant._id });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a menu item (owner only)
export const updateMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const item = await MenuItem.findById(req.params.id);

    if (!item || item.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    const { name, category, price, isAvailable } = req.body;

    if (name != null) item.name = name;
    if (category != null) item.category = category;
    if (price != null) item.price = price;
    if (isAvailable != null) {
      item.isAvailable =
        typeof isAvailable === "string"
          ? isAvailable === "true"
          : Boolean(isAvailable);
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      item.image = result.secure_url;
    }

    await item.save();

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a menu item (owner only)
export const deleteMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const item = await MenuItem.findById(req.params.id);

    if (!item || item.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    await item.deleteOne();

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
