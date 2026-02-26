import Cart from "../models/Cart.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Coupon from "../models/Coupon.js";

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;

    const menuItem = await MenuItem.findById(menuItemId);

    if (!menuItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        restaurant: menuItem.restaurant,
        items: [{ menuItem: menuItemId, quantity }],
      });
    } else {
      cart.items.push({ menuItem: menuItemId, quantity });
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.menuItem",
    );

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove item
export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    cart.items = cart.items.filter(
      (item) => item.menuItem.toString() !== req.params.itemId,
    );

    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Add Checkout API
export const checkout = async (req, res) => {
  try {
    const { pincode, couponCode } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.menuItem",
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const restaurant = await Restaurant.findById(cart.restaurant);

    if (!restaurant) {
      // Clean up stale cart pointing to a deleted/invalid restaurant
      await Cart.deleteOne({ user: req.user._id });
      return res.status(400).json({
        message:
          "The restaurant for this cart is no longer available. Please add items again from an active restaurant.",
      });
    }

    if (
      !Array.isArray(restaurant.restaurant_deliveryPincodes) ||
      !restaurant.restaurant_deliveryPincodes.includes(pincode)
    ) {
      return res.status(400).json({
        message: "Restaurant does not deliver to this pincode",
      });
    }

    let totalAmount = 0;

    const orderItems = cart.items.map((item) => {
      totalAmount += item.menuItem.price * item.quantity;

      return {
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
      };
    });

    let discount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        restaurant: cart.restaurant,
        isActive: true,
      });

      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon" });
      }

      if (coupon.validTill < new Date()) {
        return res.status(400).json({ message: "Coupon expired" });
      }

      discount = (totalAmount * coupon.discountPercent) / 100;

      if (discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }

      totalAmount -= discount;
    }

    const order = await Order.create({
      user: req.user._id,
      restaurant: cart.restaurant,
      items: orderItems,
      totalAmount,
      pincode,
    });

    await Cart.deleteOne({ user: req.user._id });

    res.status(201).json({
      order,
      discountApplied: discount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cart price summary (for showing bill before placing order)
export const getCartSummary = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.menuItem",
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const restaurant = await Restaurant.findById(cart.restaurant);

    if (!restaurant) {
      await Cart.deleteOne({ user: req.user._id });
      return res.status(400).json({
        message:
          "The restaurant for this cart is no longer available. Please add items again from an active restaurant.",
      });
    }

    let subtotal = 0;

    cart.items.forEach((item) => {
      subtotal += item.menuItem.price * item.quantity;
    });

    let discount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        restaurant: cart.restaurant,
        isActive: true,
      });

      if (coupon && coupon.validTill >= new Date()) {
        discount = (subtotal * coupon.discountPercent) / 100;

        if (discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      }
    }

    const totalPayable = subtotal - discount;

    res.json({
      subtotal,
      discountApplied: discount,
      totalPayable,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
