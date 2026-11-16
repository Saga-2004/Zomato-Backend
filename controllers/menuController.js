import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import cloudinary from "../config/cloudinary.js";

const parseBoolean = (value, fallback = true) =>
  value == null
    ? fallback
    : typeof value === "string"
      ? value === "true"
      : Boolean(value);

const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

// Add menu item
export const addMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const {
      name,
      category,
      price,
      isAvailable,
      variants,
      isVeg,
      spiceLevel,
      description,
      tags,
      allergens,
      aiGenerated,
    } = req.body;

    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    let variantsArray = [];
    let itemData = {
      restaurant: restaurant._id,
      name,
      category,
      isVeg: parseBoolean(isVeg),
      spiceLevel: spiceLevel || "mild",
      description: description?.trim(),
      tags: parseArray(tags).slice(0, 8),
      allergens: parseArray(allergens).slice(0, 8),
      aiGenerated: parseBoolean(aiGenerated, false),
      image: imageUrl,
      isAvailable: parseBoolean(isAvailable),
    };

    variantsArray = parseArray(variants);

    if (variantsArray.length > 0) {
      itemData.variants = variantsArray;
    } else {
      itemData.price = price;
    }

    const item = await MenuItem.create(itemData);

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

    const {
      name,
      category,
      price,
      isAvailable,
      variants,
      isVeg,
      spiceLevel,
      description,
      tags,
      allergens,
      aiGenerated,
    } = req.body;

    if (name != null) item.name = name;
    if (category != null) item.category = category;
    if (isVeg != null) item.isVeg = parseBoolean(isVeg);
    if (spiceLevel != null) item.spiceLevel = spiceLevel;
    if (description != null) item.description = description.trim();
    if (tags != null) item.tags = parseArray(tags).slice(0, 8);
    if (allergens != null) item.allergens = parseArray(allergens).slice(0, 8);
    if (aiGenerated != null) item.aiGenerated = parseBoolean(aiGenerated, false);
    if (price != null) item.price = price;
    if (isAvailable != null) {
      item.isAvailable =
        typeof isAvailable === "string"
          ? isAvailable === "true"
          : Boolean(isAvailable);
    }
    if (variants != null) {
      try {
        item.variants = parseArray(variants);
      } catch {
        item.variants = [];
      }
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

// Search menu items (public, for customers)
export const searchMenuItems = async (req, res) => {
  try {
    const {
      q,
      pincode,
      priceMax,
      priceMin,
      isVeg,
      category,
      spiceLevel,
      restaurantId,
      limit = 10,
    } = req.query;
    const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 20);
    const restaurantFilter = { isOpen: true };
    if (pincode) restaurantFilter.restaurant_deliveryPincodes = String(pincode);
    if (restaurantId) restaurantFilter._id = restaurantId;
    const restaurants = await Restaurant.find(restaurantFilter).select(
      "_id restaurant_name restaurant_address restaurant_deliveryPincodes image isOpen averageRating",
    );
    if (restaurants.length === 0) return res.json([]);

    const filter = {
      isAvailable: true,
      restaurant: { $in: restaurants.map((restaurant) => restaurant._id) },
    };
    const clauses = [];
    if (q && String(q).trim()) {
      const escaped = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      clauses.push({ $or: [
        { name: regex },
        { category: regex },
        { description: regex },
        { tags: regex },
      ] });
    }
    if (isVeg != null) filter.isVeg = String(isVeg) === "true";
    if (category) filter.category = new RegExp(
      String(category).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    if (spiceLevel) filter.spiceLevel = spiceLevel;
    if (priceMax != null && Number.isFinite(Number(priceMax))) {
      const max = Number(priceMax);
      clauses.push({
        $or: [
          { price: { $lte: max } },
          { variants: { $elemMatch: { price: { $lte: max } } } },
        ],
      });
    }
    if (priceMin != null && Number.isFinite(Number(priceMin))) {
      const min = Number(priceMin);
      clauses.push({
        $or: [
          { price: { $gte: min } },
          { variants: { $elemMatch: { price: { $gte: min } } } },
        ],
      });
    }
    if (clauses.length) filter.$and = clauses;

    const items = await MenuItem.find(filter).limit(safeLimit).lean();
    const restaurantMap = new Map(
      restaurants.map((restaurant) => [restaurant._id.toString(), restaurant]),
    );
    res.json(
      items.map((item) => {
        const restaurant = restaurantMap.get(item.restaurant.toString());
        return {
          menuItemId: item._id,
          restaurantId: restaurant._id,
          restaurantName: restaurant.restaurant_name,
          name: item.name,
          price: item.price,
          variants: item.variants || [],
          image: item.image,
          isVeg: item.isVeg,
          spiceLevel: item.spiceLevel,
          tags: item.tags || [],
        };
      }),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
