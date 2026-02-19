import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";

// Admin creates restaurant
export const createRestaurant = async (req, res) => {
  try {
    const { name, address, contact, ownerId } = req.body;

    // Check owner exists
    const owner = await User.findById(ownerId);

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    // Change role to restaurant
    owner.role = "restaurant";
    await owner.save();

    const restaurant = await Restaurant.create({
      owner: ownerId,
      name,
      address,
      contact,
    });

    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
