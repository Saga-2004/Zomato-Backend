import User from "../models/User.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Coupon from "../models/Coupon.js";
import bcrypt from "bcryptjs";

export const getAdminDashboard = (req, res) => {
  res.json({
    message: "Welcome Admin",
    admin: req.user,
  });
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single user (without password)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all orders for a specific user
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id })
      .populate("restaurant", "restaurant_name restaurant_address")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Block / Unblock User
export const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      message: `User ${user.isBlocked ? "Blocked" : "Unblocked"} successfully`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin View All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .populate("restaurant", "restaurant_name");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin update order status (override if needed)
export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Placed",
      "Accepted",
      "Preparing",
      "Ready for Pickup",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned",
      "Refunded",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Analytics API (basic, with daily/monthly summary)
export const getAdminAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();

    const deliveredOrders = await Order.countDocuments({
      status: "Delivered",
    });

    const cancelledOrders = await Order.countDocuments({
      status: "Cancelled",
    });

    const returnedOrders = await Order.countDocuments({
      status: "Returned",
    });

    const revenueData = await Order.aggregate([
      { $match: { status: "Delivered" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const refundsData = await Order.aggregate([
      {
        $match: {
          $or: [{ status: "Refunded" }, { paymentStatus: "Refunded" }],
        },
      },
      {
        $group: {
          _id: null,
          totalRefunds: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const totalRefunds = refundsData[0]?.totalRefunds || 0;

    // Basic daily summary (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const dailyAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "Delivered"] }, "$totalAmount", 0],
            },
          },
          totalRefunds: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$status", "Refunded"] },
                    { $eq: ["$paymentStatus", "Refunded"] },
                  ],
                },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const dailySummary = dailyAgg.map((d) => ({
      date: `${d._id.year}-${String(d._id.month).padStart(2, "0")}-${String(
        d._id.day,
      ).padStart(2, "0")}`,
      totalOrders: d.totalOrders,
      deliveredOrders: d.deliveredOrders,
      totalRevenue: d.totalRevenue,
      totalRefunds: d.totalRefunds,
    }));

    // Basic monthly summary (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const monthlyAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "Delivered"] }, "$totalAmount", 0],
            },
          },
          totalRefunds: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$status", "Refunded"] },
                    { $eq: ["$paymentStatus", "Refunded"] },
                  ],
                },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthlySummary = monthlyAgg.map((m) => ({
      month: `${m._id.year}-${String(m._id.month).padStart(2, "0")}`,
      totalOrders: m.totalOrders,
      deliveredOrders: m.deliveredOrders,
      totalRevenue: m.totalRevenue,
      totalRefunds: m.totalRefunds,
    }));

    res.json({
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      returnedOrders,
      totalRevenue,
      totalRefunds,
      dailySummary,
      monthlySummary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Refund Controller
export const refundOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Cancelled" && order.status !== "Returned") {
      return res.status(400).json({
        message: "Only cancelled or returned orders can be refunded",
      });
    }

    order.paymentStatus = "Refunded";
    order.status = "Refunded";

    await order.save();

    res.json({
      message: "Refund processed successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all delivery partners
export const getDeliveryPartners = async (req, res) => {
  try {
    const partners = await User.find({ role: "delivery_partner" }).select(
      "-password",
    );
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new delivery partner
export const createDeliveryPartner = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "delivery_partner",
    });

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a delivery partner
export const removeDeliveryPartner = async (req, res) => {
  try {
    const partner = await User.findById(req.params.id);

    if (!partner || partner.role !== "delivery_partner") {
      return res.status(404).json({ message: "Delivery partner not found" });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "Delivery partner removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Enable / Disable all offers (coupons) for a restaurant
export const toggleRestaurantOffers = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ message: "isActive boolean field is required" });
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const result = await Coupon.updateMany(
      { restaurant: restaurant._id },
      { isActive },
    );

    res.json({
      message: `Offers ${
        isActive ? "enabled" : "disabled"
      } successfully for this restaurant`,
      modifiedCoupons: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
