import express from "express";

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from "../controllers/wishlist.controller.js";

const router = express.Router();

import { verifyAnyToken } from "../middlewares/auth.middleware.js";

// Get Wishlist
router.get("/", verifyAnyToken, getWishlist);

// Add Product
router.post("/:productId", verifyAnyToken, addToWishlist);

// Remove Product
router.delete("/:productId", verifyAnyToken, removeFromWishlist);

router.get("/check/:productId", verifyAnyToken, checkWishlist);

export default router;
