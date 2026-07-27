import express from "express";

import {
  createStripePaymentIntent,
  stripeWebhook,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
} from "../controllers/payment.controller.js";

import { verifyAnyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ---------------------------------
// Stripe
// ---------------------------------

router.post(
  "/create-payment-intent",
  verifyAnyToken,
  createStripePaymentIntent,
);

router.post(
  "/webhook",
  express.raw({
    type: "application/json",
  }),
  stripeWebhook,
);

// ---------------------------------
// Razorpay
// ---------------------------------

router.post("/create-razorpay-order", verifyAnyToken, createRazorpayOrder);

router.post("/verify-razorpay", verifyAnyToken, verifyRazorpayPayment);

router.post("/razorpay/webhook", express.json(), razorpayWebhook);

export default router;
