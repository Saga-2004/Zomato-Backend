import Rating from "../models/Rating.js";
import Restaurant from "../models/Restaurant.js";

export const addRating = async (req, res) => {
  try {
    const { restaurantId, rating } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const newRating = await Rating.create({
      user: req.user._id,
      restaurant: restaurantId,
      rating,
    });

    // Update restaurant average
    restaurant.totalRatings += 1;

    restaurant.averageRating =
      (restaurant.averageRating * (restaurant.totalRatings - 1) + rating) /
      restaurant.totalRatings;

    await restaurant.save();

    res.status(201).json(newRating);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
