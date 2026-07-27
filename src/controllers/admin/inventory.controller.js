import Product from "../../models/Product.js";

// GET /api/inventory
export const getInventory = async (req, res) => {
  try {
    const {
      search,
      stockFilter,
      category,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // Search across name, brand, sku
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      query.category = { $regex: category, $options: "i" };
    }

    // Stock level filter
    if (stockFilter === "out") {
      query.stock = 0;
    } else if (stockFilter === "low") {
      query.stock = { $gt: 0, $lte: 10 };
    } else if (stockFilter === "in") {
      query.stock = { $gt: 10 };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .select("_id name brand sku category images stock price discountPrice updatedAt")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Summary counts always over full collection (unfiltered)
    const [totalCount, lowCount, outCount, categories] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ stock: 0 }),
      Product.distinct("category"), // all unique categories for the filter dropdown
    ]);

    res.status(200).json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPreviousPage: pageNum > 1,
      },
      summary: {
        total: totalCount,
        low: lowCount,
        out: outCount,
        in: totalCount - lowCount - outCount,
      },
      categories: categories.filter(Boolean).sort(),
    });
  } catch (err) {
    console.error("getInventory error:", err);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
};

// PATCH /api/inventory/:id/stock
export const updateStock = async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock === null) {
      return res.status(400).json({ message: "Stock value is required" });
    }

    const parsed = Number(stock);

    if (isNaN(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return res
        .status(400)
        .json({ message: "Stock must be a non-negative integer" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { stock: parsed } },
      { new: true, select: "_id name stock updatedAt" }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product, message: "Stock updated" });
  } catch (err) {
    console.error("updateStock error:", err);
    res.status(500).json({ message: "Failed to update stock" });
  }
};