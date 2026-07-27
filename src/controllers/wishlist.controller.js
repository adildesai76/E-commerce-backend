import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// =========================================
// Add Product to Wishlist
// POST /wishlist/:productId
// =========================================
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const exists = await Wishlist.findOne({
      user: userId,
      product: productId,
    });

    if (exists) {
      return res.status(400).json({
        message: "Product already in wishlist",
      });
    }

    const wishlist = await Wishlist.create({
      user: userId,
      product: productId,
    });

    return res.status(201).json({
      message: "Product added to wishlist",
      // wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// =========================================
// Remove Product From Wishlist
// DELETE /wishlist/:productId
// =========================================
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const wishlist = await Wishlist.findOneAndDelete({
      user: userId,
      product: productId,
    });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist item not found",
      });
    }

    return res.status(200).json({
      message: "Product removed from wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// =========================================
// Get User Wishlist
// GET /wishlist
// =========================================
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await Wishlist.find({ user: userId })
      .populate("product")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const exists = await Wishlist.exists({
      user: userId,
      product: productId,
    });

    return res.status(200).json({
      wishlisted: !!exists,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
