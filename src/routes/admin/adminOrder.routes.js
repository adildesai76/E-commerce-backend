import express from "express";

import { verifyAdminToken } from "../../middlewares/auth.middleware.js";

import {
  getAllOrders,
  updateOrderStatus,
} from "../../controllers/admin/adminOrder.controller.js";

const router = express.Router();

// Get All Orders
router.get("/", verifyAdminToken, getAllOrders);

// Update Order Status
router.patch("/:orderId/status", verifyAdminToken, updateOrderStatus);

export default router;
