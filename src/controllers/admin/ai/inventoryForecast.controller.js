import Product from "../../../models/Product.js";
import Order from "../../../models/Order.js";

import {
  generateInventoryForecastAI,
} from "../../../services/ai/inventoryAI.service.js";

export const generateInventoryForecast = async (req, res) => {
  try {
    const {
      productId,
      forecastDays = 30,
    } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Product.findById(productId).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const salesHistory = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          "items.productId": product._id,
        },
      },
      {
        $unwind: "$items",
      },
      {
        $match: {
          "items.productId": product._id,
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
            day: {
              $dayOfMonth: "$createdAt",
            },
          },
          quantitySold: {
            $sum: "$items.quantity",
          },
          orders: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ]);

    const formattedSalesHistory = salesHistory.map(
      (sale) => ({
        date: `${sale._id.year}-${String(
          sale._id.month,
        ).padStart(2, "0")}-${String(
          sale._id.day,
        ).padStart(2, "0")}`,
        quantitySold: sale.quantitySold,
        orders: sale.orders,
      }),
    );

    const forecast = await generateInventoryForecastAI({
      product,
      salesHistory: formattedSalesHistory,
      forecastDays: Number(forecastDays),
    });

    return res.status(200).json({
      success: true,
      data: {
        product: {
          id: product._id,
          name: product.name,
          stock: product.stock,
        },
        salesHistory: formattedSalesHistory,
        forecast,
      },
    });
  } catch (error) {
    console.error(
      "Inventory Forecast Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate inventory forecast",
    });
  }
};