// controllers/analytics/product.controller.js

import Product from "../../../models/Product.js";
import Order from "../../../models/Order.js";

const LOW_STOCK_THRESHOLD = 10;
const PROFIT_MARGIN = 0.3;
const ESTIMATED_PROFIT_MARGIN = 0.3;

export const getProductSummary = async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      draftProducts,
      outOfStockProducts,
      lowStockProducts,
      sales,
    ] = await Promise.all([
      Product.countDocuments(),

      Product.countDocuments({
        status: "active",
      }),

      Product.countDocuments({
        status: "draft",
      }),

      Product.countDocuments({
        $or: [{ status: "out_of_stock" }, { stock: 0 }],
      }),

      Product.countDocuments({
        stock: {
          $gt: 0,
          $lte: LOW_STOCK_THRESHOLD,
        },
      }),

      Order.aggregate([
        {
          $match: {
            status: "Confirmed",
          },
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: null,

            productsSold: {
              $sum: "$items.quantity",
            },

            totalRevenue: {
              $sum: {
                $multiply: [
                  "$items.quantity",
                  {
                    $ifNull: ["$items.discountPrice", "$items.price"],
                  },
                ],
              },
            },
          },
        },
      ]),
    ]);

    const productsSold = sales[0]?.productsSold ?? 0;
    const totalRevenue = sales[0]?.totalRevenue ?? 0;

    const estimatedProfit = Number((totalRevenue * PROFIT_MARGIN).toFixed(2));

    return res.status(200).json({
      success: true,

      productSummary: {
        totalProducts,
        activeProducts,
        draftProducts,
        outOfStockProducts,
        lowStockProducts,
        productsSold,
        totalRevenue,
        estimatedProfit,
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

const getProductSalesAnalytics = async () => {
  return await Order.aggregate([
    {
      $match: {
        status: "Confirmed",
      },
    },

    {
      $unwind: "$items",
    },

    {
      $group: {
        _id: "$items.productId",

        name: {
          $first: "$items.name",
        },

        image: {
          $first: "$items.image",
        },

        category: {
          $first: "$items.category",
        },

        unitsSold: {
          $sum: "$items.quantity",
        },

        revenue: {
          $sum: {
            $multiply: [
              "$items.quantity",
              {
                $ifNull: ["$items.discountPrice", "$items.price"],
              },
            ],
          },
        },

        orders: {
          $sum: 1,
        },
      },
    },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: {
        path: "$product",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        _id: 1,

        name: 1,

        image: 1,

        category: 1,

        unitsSold: 1,

        revenue: 1,

        orders: 1,

        stock: {
          $ifNull: ["$product.stock", 0],
        },

        status: {
          $ifNull: ["$product.status", "deleted"],
        },

        price: {
          $ifNull: ["$product.price", 0],
        },

        discountPrice: {
          $ifNull: ["$product.discountPrice", 0],
        },
      },
    },
  ]);
};

export const getTopSellingProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const products = await getProductSalesAnalytics();

    products.sort((a, b) => b.unitsSold - a.unitsSold);

    return res.status(200).json({
      success: true,

      topSellingProducts: products.slice(0, limit),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLeastSellingProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const products = await Product.aggregate([
      {
        $lookup: {
          from: "orders",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                status: "Confirmed",
              },
            },
            {
              $unwind: "$items",
            },
            {
              $match: {
                $expr: {
                  $eq: ["$items.productId", "$$productId"],
                },
              },
            },
            {
              $group: {
                _id: null,

                unitsSold: {
                  $sum: "$items.quantity",
                },

                revenue: {
                  $sum: {
                    $multiply: [
                      "$items.quantity",
                      {
                        $ifNull: [
                          "$items.discountPrice",
                          "$items.price",
                        ],
                      },
                    ],
                  },
                },

                orders: {
                  $sum: 1,
                },
              },
            },
          ],
          as: "sales",
        },
      },

      {
        $addFields: {
          sales: {
            $ifNull: [
              {
                $arrayElemAt: ["$sales", 0],
              },
              {
                unitsSold: 0,
                revenue: 0,
                orders: 0,
              },
            ],
          },
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          category: 1,
          image: {
            $arrayElemAt: ["$images", 0],
          },
          stock: 1,
          status: 1,
          price: 1,
          discountPrice: 1,

          unitsSold: "$sales.unitsSold",
          revenue: "$sales.revenue",
          orders: "$sales.orders",
        },
      },

      {
        $sort: {
          unitsSold: 1,
          revenue: 1,
          createdAt: -1,
        },
      },

      {
        $limit: limit,
      },
    ]);

    return res.status(200).json({
      success: true,
      leastSellingProducts: products,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRevenueByProduct = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const products = await getProductSalesAnalytics();

    products.sort((a, b) => b.revenue - a.revenue);

    return res.status(200).json({
      success: true,
      revenueByProduct: products.slice(0, limit),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProfitByProduct = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const products = await getProductSalesAnalytics();

    const profitAnalytics = products
      .map((product) => ({
        ...product,
        estimatedProfit: Number(
          (product.revenue * ESTIMATED_PROFIT_MARGIN).toFixed(2),
        ),
      }))
      .sort((a, b) => b.estimatedProfit - a.estimatedProfit);

    return res.status(200).json({
      success: true,
      profitByProduct: profitAnalytics.slice(0, limit),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
