import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";

// CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, totalAmount, pincode } = req.body;

    // Check restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Check pincode availability
    if (
      !Array.isArray(restaurant.restaurant_deliveryPincodes) ||
      !restaurant.restaurant_deliveryPincodes.includes(pincode)
    ) {
      return res.status(400).json({
        message: "Restaurant does not deliver to this pincode",
      });
    }

    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantId,
      items,
      totalAmount,
      pincode,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET MY ORDERS (Customer)
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("restaurant", "name address")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Restaurant Get Its Orders
export const getRestaurantOrders = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    // console.log(req.user);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate("user", "name phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Update Order Status (restaurant owner)
export const updateOrderStatus = async (req, res) => {
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

//Add Assign Delivery Partner API
export const assignDeliveryPartner = async (req, res) => {
  try {
    const { deliveryPartnerId } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.deliveryPartner = deliveryPartnerId;
    order.status = "Out for Delivery";

    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get Delivery Partner Order
export const getDeliveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        // Orders already assigned to this partner
        { deliveryPartner: req.user._id },
        // Ready for pickup and not yet assigned – available to claim
        { deliveryPartner: null, status: "Ready for Pickup" },
      ],
    })
      .populate("restaurant", "name address")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delivery partner claims an unassigned ready-for-pickup order
export const claimDeliveryOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.deliveryPartner && order.deliveryPartner.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: "Order already assigned to another partner" });
    }

    if (order.status !== "Ready for Pickup") {
      return res.status(400).json({ message: "Only 'Ready for Pickup' orders can be claimed" });
    }

    order.deliveryPartner = req.user._id;
    order.status = "Out for Delivery";

    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Update Delivery Status (delivery partner)
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Out for Delivery",
      "Delivered",
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

//Restaurant Analytics (basic, with daily/monthly summary)
export const getRestaurantAnalytics = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      ownerId: req.user._id,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const baseMatch = { restaurant: restaurant._id };

    const totalOrders = await Order.countDocuments(baseMatch);

    const deliveredOrders = await Order.countDocuments({
      ...baseMatch,
      status: "Delivered",
    });

    const cancelledOrders = await Order.countDocuments({
      ...baseMatch,
      status: "Cancelled",
    });

    const returnedOrders = await Order.countDocuments({
      ...baseMatch,
      status: "Returned",
    });

    const revenueData = await Order.aggregate([
      {
        $match: {
          ...baseMatch,
          status: "Delivered",
        },
      },
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
          ...baseMatch,
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
          ...baseMatch,
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
              $cond: [
                { $eq: ["$status", "Delivered"] },
                "$totalAmount",
                0,
              ],
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
          ...baseMatch,
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
              $cond: [
                { $eq: ["$status", "Delivered"] },
                "$totalAmount",
                0,
              ],
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

//Add Cancel API
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Cannot cancel if already delivered
    if (order.status === "Delivered") {
      return res.status(400).json({
        message: "Delivered orders cannot be cancelled",
      });
    }

    // Check time difference (5 minutes rule)
    const currentTime = new Date();
    const orderTime = new Date(order.createdAt);

    const diffInMinutes = (currentTime - orderTime) / (1000 * 60);

    if (diffInMinutes > 5) {
      return res.status(400).json({
        message: "Cancellation window expired",
      });
    }

    order.status = "Cancelled";
    await order.save();

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
