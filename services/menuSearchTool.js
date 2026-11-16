import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const numberOrUndefined = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const searchMenuForCustomer = async (args, pincode) => {
  const filter = { isAvailable: true };
  const restaurantFilter = { isOpen: true };
  if (pincode) restaurantFilter.restaurant_deliveryPincodes = String(pincode);

  const restaurants = await Restaurant.find(restaurantFilter).select(
    "_id restaurant_name isOpen",
  );
  if (!restaurants.length) return [];
  filter.restaurant = { $in: restaurants.map((restaurant) => restaurant._id) };

  if (args.query) {
    const regex = new RegExp(escapeRegex(args.query), "i");
    filter.$or = [
      { name: regex },
      { category: regex },
      { description: regex },
      { tags: regex },
    ];
  }
  if (args.isVeg != null) filter.isVeg = args.isVeg;
  if (args.category) filter.category = new RegExp(escapeRegex(args.category), "i");
  if (args.spiceLevel) filter.spiceLevel = args.spiceLevel;

  const maxPrice = numberOrUndefined(args.maxPrice);
  if (maxPrice != null) {
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { price: { $lte: maxPrice } },
          { variants: { $elemMatch: { price: { $lte: maxPrice } } } },
        ],
      },
    ];
  }
  const minPrice = numberOrUndefined(args.minPrice);
  if (minPrice != null) {
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { price: { $gte: minPrice } },
          { variants: { $elemMatch: { price: { $gte: minPrice } } } },
        ],
      },
    ];
  }

  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);
  const items = await MenuItem.find(filter).limit(limit).lean();
  const restaurantMap = new Map(
    restaurants.map((restaurant) => [restaurant._id.toString(), restaurant]),
  );
  return items.map((item) => {
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
  });
};
