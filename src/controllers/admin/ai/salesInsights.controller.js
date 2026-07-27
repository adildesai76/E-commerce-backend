import Order from "../../../models/Order.js";

import {
  generateSalesInsightsAI,
} from "../../../services/ai/salesAI.service.js";

export const generateSalesInsights = async (req, res) => {
  try {
    const { type = "daily" } = req.query;

    let groupId;
    let sort = {};
    const labels = [];

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
        labels.push(
          `${item._id.day}/${item._id.month}/${item._id.year}`,
        );
      }

      if (type === "monthly") {
        labels.push(
          new Date(
            item._id.year,
            item._id.month - 1,
          ).toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
        );
      }

      if (type === "yearly") {
        labels.push(item._id.year.toString());
      }

      revenue.push(item.revenue);
      orders.push(item.orders);
    });

    const analyticsData = {
      type,
      labels,
      revenue,
      orders,
    };

    const insights = await generateSalesInsightsAI({
      analyticsData,
    });

    return res.status(200).json({
      success: true,
      data: {
        analytics: analyticsData,
        insights,
      },
    });
  } catch (error) {
    console.error("Sales Insights Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to generate sales insights",
    });
  }
};