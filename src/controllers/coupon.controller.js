import Coupon from "../models/Coupon.js";
import Cart from "../models/Cart.js";

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      value,
      minimumOrderAmount,
      maximumDiscount,
      usageLimit,
      status,
      appliesTo,
      products,
      categories,
      startDate,
      expiryDate,
    } = req.body;

    const existingCoupon = await Coupon.findOne({
      code: code.toUpperCase(),
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists.",
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      type,
      value,
      minimumOrderAmount,
      maximumDiscount,
      usageLimit,
      status,
      appliesTo,
      products,
      categories,
      startDate,
      expiryDate,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully.",
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      type,
      appliesTo,
    } = req.query;

    const query = {};

    // Search by coupon code
    if (search) {
      query.code = {
        $regex: search,
        $options: "i",
      };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Coupon type filter
    if (type) {
      query.type = type;
    }

    // Applies To filter
    if (appliesTo) {
      query.appliesTo = appliesTo;
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const total = await Coupon.countDocuments(query);

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    return res.status(200).json({
      success: true,
      coupons,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber < Math.ceil(total / limitNumber),
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", type, appliesTo } = req.query;

    const currentDate = new Date();

    const query = {
      status: "active",
      startDate: { $lte: currentDate },
      expiryDate: { $gte: currentDate },
      $expr: {
        $lt: ["$usedCount", "$usageLimit"],
      },
    };

    // Search by coupon code
    if (search) {
      query.code = {
        $regex: search,
        $options: "i",
      };
    }

    // Coupon type filter
    if (type) {
      query.type = type;
    }

    // Applies To filter
    if (appliesTo) {
      query.appliesTo = appliesTo;
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const total = await Coupon.countDocuments(query);

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    return res.status(200).json({
      success: true,
      coupons,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber < Math.ceil(total / limitNumber),
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    return res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      code,
      description,
      type,
      value,
      minimumOrderAmount,
      maximumDiscount,
      usageLimit,
      status,
      appliesTo,
      products,
      categories,
      startDate,
      expiryDate,
    } = req.body;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    // Check duplicate coupon code
    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        code: code.toUpperCase(),
        _id: { $ne: id },
      });

      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: "Coupon code already exists.",
        });
      }

      coupon.code = code.toUpperCase();
    }

    coupon.description = description;
    coupon.type = type;
    coupon.value = value;
    coupon.minimumOrderAmount = minimumOrderAmount;
    coupon.maximumDiscount = maximumDiscount;
    coupon.usageLimit = usageLimit;
    coupon.status = status;
    coupon.appliesTo = appliesTo;
    coupon.products = products;
    coupon.categories = categories;
    coupon.startDate = startDate;
    coupon.expiryDate = expiryDate;

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully.",
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    await coupon.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "scheduled", "expired"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon status.",
      });
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }

    coupon.status = status;

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon ${status} successfully.`,
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const summary = cart.items.reduce(
      (acc, item) => {
        const originalPrice = item.price;
        const sellingPrice = item.discountPrice ?? item.price;

        acc.subtotal += originalPrice * item.quantity;
        acc.total += sellingPrice * item.quantity;
        acc.itemCount += item.quantity;

        return acc;
      },
      {
        subtotal: 0,
        total: 0,
        itemCount: 0,
      },
    );

    const products = cart.items.map((item) => ({
      productId: item.productId.toString(),
      category: item.category,
    }));

    const subtotal = summary.subtotal;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code.",
      });
    }

    if (coupon.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Coupon is inactive.",
      });
    }

    const now = new Date();

    if (coupon.startDate > now) {
      return res.status(400).json({
        success: false,
        message: "Coupon is not active yet.",
      });
    }

    if (coupon.expiryDate < now) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired.",
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached.",
      });
    }

    if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${coupon.minimumOrderAmount}.`,
      });
    }

    // Product validation
    if (coupon.appliesTo === "products") {
      const valid = products.some((item) =>
        coupon.products.some(
          (productId) => productId.toString() === item.productId,
        ),
      );

      if (!valid) {
        return res.status(400).json({
          success: false,
          message: "Coupon is not applicable to selected products.",
        });
      }
    }

    // Category validation
    if (coupon.appliesTo === "categories") {
      const valid = products.some((item) =>
        coupon.categories.includes(item.category),
      );

      if (!valid) {
        return res.status(400).json({
          success: false,
          message: "Coupon is not applicable to selected categories.",
        });
      }
    }

    let discount = 0;

    if (coupon.type === "percentage") {
      discount = (subtotal * coupon.value) / 100;

      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount;
      }
    } else {
      discount = coupon.value;
    }

    discount = Math.min(discount, subtotal);

    // Save applied coupon in cart
    cart.appliedCoupon = {
      code: coupon.code,
      discount,
    };

    await cart.save();

    return res.status(200).json({
      success: true,
      appliedCoupon: {
        code: coupon.code,
        coupon_discount: discount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      userId: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    if (!cart.appliedCoupon) {
      return res.status(400).json({
        success: false,
        message: "No coupon is applied.",
      });
    }

    cart.appliedCoupon = null;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Coupon removed successfully.",
    });
  } catch (error) {
    console.error("Remove Coupon Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove coupon.",
    });
  }
};
