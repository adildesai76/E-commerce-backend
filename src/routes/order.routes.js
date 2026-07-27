import express from "express";

import { verifyAnyToken } from "../middlewares/auth.middleware.js";

import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

// Create Order
router.post("/", verifyAnyToken, createOrder);

// Get Logged-in User Orders
router.get("/", verifyAnyToken, getMyOrders);

// Get Single Order
router.get("/:orderId", verifyAnyToken, getOrderById);

// Cancel Order
router.patch("/:orderId/cancel", verifyAnyToken, cancelOrder);

export default router;
