import User from "../../../models/User.js";
import Order from "../../../models/Order.js";
import mongoose from "mongoose";

export const getCustomerSummary = async (req, res) => {
  try {
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const week = new Date(today);
    week.setDate(today.getDate() - 6);

    const month = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCustomers, newToday, newWeek, newMonth, orderAnalytics] =
      await Promise.all([
        User.countDocuments({ role: "customer" }),

        User.countDocuments({
          role: "customer",
          createdAt: { $gte: today },
        }),

        User.countDocuments({
          role: "customer",
          createdAt: { $gte: week },
        }),

        User.countDocuments({
          role: "customer",
          createdAt: { $gte: month },
        }),

        Order.aggregate([
          {
            $match: {
              "payment.status": "Paid",
            },
          },

          {
            $group: {
              _id: "$userId",

              totalSpent: {
                $sum: "$summary.total",
              },

              totalOrders: {
                $sum: 1,
              },
            },
          },

          {
            $group: {
              _id: null,

              activeCustomers: {
                $sum: 1,
              },

              returningCustomers: {
                $sum: {
                  $cond: [
                    {
                      $gte: ["$totalOrders", 2],
                    },
                    1,
                    0,
                  ],
                },
              },

              totalRevenue: {
                $sum: "$totalSpent",
              },

              totalOrders: {
                $sum: "$totalOrders",
              },
            },
          },
        ]),
      ]);

    const analytics = orderAnalytics[0] || {
      activeCustomers: 0,
      returningCustomers: 0,
      totalRevenue: 0,
      totalOrders: 0,
    };

    const averageSpend =
      analytics.activeCustomers > 0
        ? analytics.totalRevenue / analytics.activeCustomers
        : 0;

    const averageCLV = averageSpend;

    const averageOrderFrequency =
      analytics.activeCustomers > 0
        ? analytics.totalOrders / analytics.activeCustomers
        : 0;

    return res.status(200).json({
      success: true,

      customerSummary: {
        totalCustomers,

        activeCustomers: analytics.activeCustomers,

        newCustomersToday: newToday,

        newCustomersThisWeek: newWeek,

        newCustomersThisMonth: newMonth,

        returningCustomers: analytics.returningCustomers,

        averageSpend: Number(averageSpend.toFixed(2)),

        averageCLV: Number(averageCLV.toFixed(2)),

        averageOrderFrequency: Number(averageOrderFrequency.toFixed(2)),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTopCustomers = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const customers = await Order.aggregate([
      {
        $match: {
          "payment.status": "Paid",
        },
      },

      {
        $group: {
          _id: "$userId",

          totalOrders: {
            $sum: 1,
          },

          totalSpent: {
            $sum: "$summary.total",
          },

          lastPurchase: {
            $max: "$createdAt",
          },
        },
      },

      {
        $addFields: {
          averageOrderValue: {
            $cond: [
              {
                $gt: ["$totalOrders", 0],
              },
              {
                $divide: ["$totalSpent", "$totalOrders"],
              },
              0,
            ],
          },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },

      {
        $unwind: "$customer",
      },

      {
        $match: {
          "customer.role": "customer",
        },
      },

      {
        $project: {
          _id: "$customer._id",

          name: "$customer.name",

          email: "$customer.email",

          avatar: "$customer.avatar",

          joinedAt: "$customer.createdAt",

          totalOrders: 1,

          totalSpent: {
            $round: ["$totalSpent", 2],
          },

          averageOrderValue: {
            $round: ["$averageOrderValue", 2],
          },

          lastPurchase: 1,
        },
      },

      {
        $sort: {
          totalSpent: -1,
        },
      },

      {
        $limit: limit,
      },
    ]);

    return res.status(200).json({
      success: true,
      topCustomers: customers,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCustomerRegistrationTrend = async (req, res) => {
  try {
    const { type = "daily" } = req.query;

    let groupStage = {};
    let sortStage = {};

    switch (type) {
      case "monthly":
        groupStage = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };

        sortStage = {
          "_id.year": 1,
          "_id.month": 1,
        };
        break;

      case "yearly":
        groupStage = {
          year: { $year: "$createdAt" },
        };

        sortStage = {
          "_id.year": 1,
        };
        break;

      default:
        groupStage = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };

        sortStage = {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        };
    }

    const trend = await User.aggregate([
      {
        $match: {
          role: "customer",
        },
      },

      {
        $group: {
          _id: groupStage,
          customers: {
            $sum: 1,
          },
        },
      },

      {
        $sort: sortStage,
      },
    ]);

    const labels = trend.map((item) => {
      if (type === "yearly") {
        return `${item._id.year}`;
      }

      if (type === "monthly") {
        return `${item._id.month}/${item._id.year}`;
      }

      return `${item._id.day}/${item._id.month}/${item._id.year}`;
    });

    const customers = trend.map((item) => item.customers);

    return res.status(200).json({
      success: true,
      type,
      labels,
      customers,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRepeatVsNewCustomers = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          "payment.status": "Paid",
        },
      },

      {
        $group: {
          _id: "$userId",
          totalOrders: {
            $sum: 1,
          },
        },
      },

      {
        $group: {
          _id: null,

          newCustomers: {
            $sum: {
              $cond: [
                {
                  $eq: ["$totalOrders", 1],
                },
                1,
                0,
              ],
            },
          },

          returningCustomers: {
            $sum: {
              $cond: [
                {
                  $gte: ["$totalOrders", 2],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const analytics = result[0] || {
      newCustomers: 0,
      returningCustomers: 0,
    };

    const total = analytics.newCustomers + analytics.returningCustomers;

    return res.status(200).json({
      success: true,

      repeatCustomers: {
        ...analytics,

        totalCustomers: total,

        newPercentage:
          total > 0
            ? Number(((analytics.newCustomers / total) * 100).toFixed(2))
            : 0,

        returningPercentage:
          total > 0
            ? Number(((analytics.returningCustomers / total) * 100).toFixed(2))
            : 0,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCustomerOrderFrequency = async (req, res) => {
  try {
    const orders = await Order.aggregate([
      {
        $match: {
          "payment.status": "Paid",
        },
      },

      {
        $group: {
          _id: "$userId",
          totalOrders: {
            $sum: 1,
          },
        },
      },
    ]);

    const frequency = [
      {
        range: "1 Order",
        customers: 0,
      },
      {
        range: "2-5 Orders",
        customers: 0,
      },
      {
        range: "6-10 Orders",
        customers: 0,
      },
      {
        range: "10+ Orders",
        customers: 0,
      },
    ];

    for (const customer of orders) {
      if (customer.totalOrders === 1) {
        frequency[0].customers++;
      } else if (customer.totalOrders >= 2 && customer.totalOrders <= 5) {
        frequency[1].customers++;
      } else if (customer.totalOrders >= 6 && customer.totalOrders <= 10) {
        frequency[2].customers++;
      } else {
        frequency[3].customers++;
      }
    }

    const totalCustomers = orders.length;

    const orderFrequency = frequency.map((item) => ({
      ...item,
      percentage:
        totalCustomers > 0
          ? Number(((item.customers / totalCustomers) * 100).toFixed(2))
          : 0,
    }));

    return res.status(200).json({
      success: true,
      orderFrequency,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFavoriteCategories = async (req, res) => {
  try {
    const categories = await Order.aggregate([
      {
        $match: {
          "payment.status": "Paid",
        },
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.category",

          orders: {
            $addToSet: "$_id",
          },

          quantitySold: {
            $sum: "$items.quantity",
          },

          revenue: {
            $sum: {
              $multiply: [
                {
                  $ifNull: ["$items.discountPrice", "$items.price"],
                },
                "$items.quantity",
              ],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          category: "$_id",
          orders: {
            $size: "$orders",
          },
          quantitySold: 1,
          revenue: {
            $round: ["$revenue", 2],
          },
        },
      },

      {
        $sort: {
          quantitySold: -1,
        },
      },
    ]);

    const totalQuantity = categories.reduce(
      (sum, category) => sum + category.quantitySold,
      0,
    );

    const favoriteCategories = categories.map((category) => ({
      ...category,
      percentage:
        totalQuantity > 0
          ? Number(((category.quantitySold / totalQuantity) * 100).toFixed(2))
          : 0,
    }));

    return res.status(200).json({
      success: true,
      favoriteCategories,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
