import express from "express";
const router = express.Router();

import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller.js";
import { verifyAnyToken } from "../middlewares/auth.middleware.js"; // your auth middleware

router.use(verifyAnyToken);

router.route("/").get(getCart).post(addToCart).delete(clearCart);

router.route("/:productId").patch(updateCartItem).delete(removeCartItem);

export default router;
