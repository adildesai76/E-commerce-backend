import stripe from "../config/stripe.js";
import Refund from "../models/Refund.js";
import Order from "../models/Order.js";
import { creditWallet } from "../utils/wallet.js";

export const requestRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.id,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (["Cancelled", "Delivered"].includes(order.status)) {
      throw new Error("Refund cannot be requested");
    }

    const existingRefund = await Refund.findOne({
      orderId,
      status: {
        $in: ["REQUESTED", "APPROVED"],
      },
    });

    if (existingRefund) {
      throw new Error("Refund already requested");
    }

    const refund = await Refund.create({
      orderId: order._id,

      userId: req.user.id,

      amount: order.summary.total,

      reason,

      refundMethod:
        order.payment.gateway === "STRIPE"
          ? "STRIPE"
          : order.payment.gateway === "RAZORPAY"
            ? "RAZORPAY"
            : "WALLET",
    });

    res.status(201).json({
      success: true,
      message: "Refund request created",
      refund,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
