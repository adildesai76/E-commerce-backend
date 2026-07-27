import Order from "../../../models/Order.js";
import Refund from "../../../models/Refund.js";

const SALES_STATUSES = [
  "Confirmed",
  "Processing",
  "Shipped",
  "Out For Delivery",
  "Delivered",
];

// Temporary until Settings module is created
const SHIPPING_CHARGE = 99;
const FREE_SHIPPING_ABOVE = 999;

const PROFIT_MARGIN = 30;

const calculateShipping = (total) => {
  return total < FREE_SHIPPING_ABOVE ? SHIPPING_CHARGE : 0;
};

const getDateRanges = () => {
  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const week = new Date(today);
  week.setDate(week.getDate() - 6);

  const month = new Date(now.getFullYear(), now.getMonth(), 1);

  const year = new Date(now.getFullYear(), 0, 1);

  return {
    today,
    tomorrow,
    yesterday,
    week,
    month,
    year,
  };
};

export const getSalesSummary = async (req, res) => {
  try {
    const { today, tomorrow, yesterday, week, month, year } = getDateRanges();

    const orders = await Order.find({
      status: {
        $in: SALES_STATUSES,
      },
    })
      .select("summary payment createdAt")
      .lean();

    let totalRevenue = 0;
    let totalOrders = orders.length;

    let todayRevenue = 0;
    let yesterdayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;
    let yearRevenue = 0;

    let todayOrders = 0;
    let yesterdayOrders = 0;
    let weekOrders = 0;
    let monthOrders = 0;
    let yearOrders = 0;

    let totalDiscount = 0;

    orders.forEach((order) => {
      const shipping = calculateShipping(order.summary.total);

      const revenue = order.summary.total + shipping;

      totalRevenue += revenue;

      totalDiscount +=
        (order.summary.discount || 0) + (order.summary.couponDiscount || 0);

      const createdAt = new Date(order.createdAt);

      if (createdAt >= today && createdAt < tomorrow) {
        todayRevenue += revenue;
        todayOrders++;
      }

      if (createdAt >= yesterday && createdAt < today) {
        yesterdayRevenue += revenue;
        yesterdayOrders++;
      }

      if (createdAt >= week) {
        weekRevenue += revenue;
        weekOrders++;
      }

      if (createdAt >= month) {
        monthRevenue += revenue;
        monthOrders++;
      }

      if (createdAt >= year) {
        yearRevenue += revenue;
        yearOrders++;
      }
    });

    const refunds = await Refund.find({
      status: {
        $in: ["APPROVED", "COMPLETED"],
      },
    })
      .select("amount")
      .lean();

    const totalRefundAmount = refunds.reduce(
      (sum, refund) => sum + refund.amount,
      0,
    );

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const grossProfit = totalRevenue * (PROFIT_MARGIN / 100);

    const netProfit = grossProfit - totalRefundAmount - totalDiscount;

    return res.status(200).json({
      success: true,

      summary: {
        totalRevenue,

        totalOrders,

        todayRevenue,
        yesterdayRevenue,
        weekRevenue,
        monthRevenue,
        yearRevenue,

        todayOrders,
        yesterdayOrders,
        weekOrders,
        monthOrders,
        yearOrders,

        averageOrderValue,

        grossProfit,

        netProfit,

        totalRefundAmount,

        totalDiscount,
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

export const getSalesAnalytics = async (req, res) => {
  try {
    const { type = "daily" } = req.query;

    let groupId;
    let sort = {};
    let labels = [];

    switch (type) {
      case "daily":
        groupId = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };

        sort = {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        };
        break;

      case "monthly":
        groupId = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };

        sort = {
          "_id.year": 1,
          "_id.month": 1,
        };
        break;

      case "yearly":
        groupId = {
          year: { $year: "$createdAt" },
        };

        sort = {
          "_id.year": 1,
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type.",
        });
    }

    const sales = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $group: {
          _id: groupId,
          revenue: {
            $sum: "$summary.total",
          },
          orders: {
            $sum: 1,
          },
        },
      },
      {
        $sort: sort,
      },
    ]);

    const revenue = [];
    const orders = [];

    sales.forEach((item) => {
      if (type === "daily") {
        labels.push(`${item._id.day}/${item._id.month}/${item._id.year}`);
      }

      if (type === "monthly") {
        labels.push(
          new Date(item._id.year, item._id.month - 1).toLocaleString(
            "default",
            {
              month: "short",
              year: "numeric",
            },
          ),
        );
      }

      if (type === "yearly") {
        labels.push(item._id.year.toString());
      }

      revenue.push(item.revenue);
      orders.push(item.orders);
    });

    return res.status(200).json({
      success: true,
      labels,
      revenue,
      orders,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getPaymentAnalytics = async (req, res) => {
  try {
    const paymentAnalytics = await Order.aggregate([
      {
        $match: {
          status: {
            $in: SALES_STATUSES,
          },
        },
      },

      {
        $group: {
          _id: "$payment.gateway",

          orders: {
            $sum: 1,
          },

          revenue: {
            $sum: {
              $add: [
                "$summary.total",
                {
                  $cond: [
                    {
                      $lt: ["$summary.total", FREE_SHIPPING_ABOVE],
                    },
                    SHIPPING_CHARGE,
                    0,
                  ],
                },
              ],
            },
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },
    ]);

    const totalRevenue = paymentAnalytics.reduce(
      (sum, item) => sum + item.revenue,
      0,
    );

    const data = paymentAnalytics.map((item) => ({
      method: item._id,

      orders: item.orders,

      revenue: item.revenue,

      percentage:
        totalRevenue > 0
          ? Number(((item.revenue / totalRevenue) * 100).toFixed(2))
          : 0,
    }));

    return res.status(200).json({
      success: true,
      paymentAnalytics: data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDiscountAnalytics = async (req, res) => {
  try {
    const discountAnalytics = await Order.aggregate([
      {
        $match: {
          status: {
            $in: SALES_STATUSES,
          },
        },
      },

      {
        $group: {
          _id: null,

          totalDiscount: {
            $sum: {
              $ifNull: ["$summary.discount", 0],
            },
          },

          couponDiscount: {
            $sum: {
              $ifNull: ["$summary.couponDiscount", 0],
            },
          },

          ordersUsingCoupon: {
            $sum: {
              $cond: [
                {
                  $ne: ["$appliedCoupon.code", null],
                },
                1,
                0,
              ],
            },
          },

          totalOrders: {
            $sum: 1,
          },
        },
      },
    ]);

    const result = discountAnalytics[0] || {
      totalDiscount: 0,
      couponDiscount: 0,
      ordersUsingCoupon: 0,
      totalOrders: 0,
    };

    const productDiscount = result.totalDiscount - result.couponDiscount;

    const couponUsageRate =
      result.totalOrders > 0
        ? Number(
            ((result.ordersUsingCoupon / result.totalOrders) * 100).toFixed(2),
          )
        : 0;

    return res.status(200).json({
      success: true,

      discountAnalytics: {
        totalDiscount: result.totalDiscount,

        productDiscount,

        couponDiscount: result.couponDiscount,

        ordersUsingCoupon: result.ordersUsingCoupon,

        couponUsageRate,
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

export const getOrderStatusAnalytics = async (req, res) => {
  try {
    const orderStatusAnalytics = await Order.aggregate([
      {
        $group: {
          _id: "$status",

          orders: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          orders: -1,
        },
      },
    ]);

    const data = orderStatusAnalytics.map((item) => ({
      status: item._id,
      orders: item.orders,
    }));

    return res.status(200).json({
      success: true,
      orderStatusAnalytics: data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRefundAnalytics = async (req, res) => {
  try {
    const refundAnalytics = await Refund.aggregate([
      {
        $group: {
          _id: "$status",

          count: {
            $sum: 1,
          },

          amount: {
            $sum: "$amount",
          },
        },
      },

      {
        $sort: {
          count: -1,
        },
      },
    ]);

    const totalRefundAmount = refundAnalytics.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const totalRefunds = refundAnalytics.reduce(
      (sum, item) => sum + item.count,
      0,
    );

    const data = refundAnalytics.map((item) => ({
      status: item._id,

      count: item.count,

      amount: item.amount,

      percentage:
        totalRefunds > 0
          ? Number(((item.count / totalRefunds) * 100).toFixed(2))
          : 0,
    }));

    return res.status(200).json({
      success: true,

      summary: {
        totalRefunds,
        totalRefundAmount,
      },

      refundAnalytics: data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCategoryRevenueAnalytics = async (req, res) => {
  try {
    const categoryAnalytics = await Order.aggregate([
      {
        $match: {
          status: {
            $in: SALES_STATUSES,
          },
        },
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.category",

          revenue: {
            $sum: {
              $multiply: [
                {
                  $cond: [
                    {
                      $ne: ["$items.discountPrice", null],
                    },
                    "$items.discountPrice",
                    "$items.price",
                  ],
                },
                "$items.quantity",
              ],
            },
          },

          productsSold: {
            $sum: "$items.quantity",
          },

          orders: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          revenue: -1,
        },
      },
    ]);

    const totalRevenue = categoryAnalytics.reduce(
      (sum, item) => sum + item.revenue,
      0,
    );

    const data = categoryAnalytics.map((item) => ({
      category: item._id,

      revenue: item.revenue,

      productsSold: item.productsSold,

      orders: item.orders,

      percentage:
        totalRevenue > 0
          ? Number(((item.revenue / totalRevenue) * 100).toFixed(2))
          : 0,
    }));

    return res.status(200).json({
      success: true,
      categoryAnalytics: data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
