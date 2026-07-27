import express from "express";

import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  updateCouponStatus,
  applyCoupon,
  removeCoupon,
  getUserCoupons,
} from "../controllers/coupon.controller.js";

import {
  verifyAdminToken,
  verifyAnyToken,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Admin
router.get("/admin", verifyAdminToken, getCoupons);

// User
router.get("/", verifyAnyToken, getUserCoupons);

// Create coupon
router.post("/", verifyAdminToken, createCoupon);

// Customer
router.post("/apply", verifyAnyToken, applyCoupon);

router.delete("/remove", verifyAnyToken, removeCoupon);

// Admin
router.get("/:id", verifyAdminToken, getCouponById);

router.put("/:id", verifyAdminToken, updateCoupon);

router.patch("/:id/status", verifyAdminToken, updateCouponStatus);

router.delete("/:id", verifyAdminToken, deleteCoupon);

export default router;