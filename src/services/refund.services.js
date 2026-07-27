import stripe from "../config/stripe.js";
import razorpay from "../config/razorpay.js";
import axios from "axios";
import Refund from "../models/Refund.js";

import { sendNotification } from "../utils/sendNotification.js";
import { creditWallet } from "../utils/wallet.js";

export const processRefund = async ({
  order,
  reason = "Order cancelled",
  session = null,
}) => {
  // --------------------------------------------------
  // Create Refund Record
  // --------------------------------------------------

  const refund = await Refund.create(
    [
      {
        orderId: order._id,
        userId: order.userId,
        amount: order.summary.total,
        reason,
        refundMethod:
          order.payment.gateway === "STRIPE"
            ? "STRIPE"
            : order.payment.gateway === "RAZORPAY"
              ? "RAZORPAY"
              : "WALLET",
        status: "APPROVED",
      },
    ],
    { session },
  );

  const createdRefund = refund[0];

  // --------------------------------------------------
  // Process Refund
  // --------------------------------------------------

  if (order.payment.gateway === "STRIPE") {
    await stripe.refunds.create({
      payment_intent: order.payment.transactionId,
    });
  }

  // -------------------------------------------------- 
  // Razorpay Refund
  // --------------------------------------------------
  else if (order.payment.gateway === "RAZORPAY") {
    const payment = await razorpay.payments.fetch(order.payment.transactionId);

    const refund = await razorpay.payments.refund(payment.id, {
      amount: 100, // ₹1
    });

    // console.log("Razorpay Refund:", refund);
  }

  // --------------------------------------------------
  // Wallet Refund
  // --------------------------------------------------
  else if (order.payment.gateway === "WALLET") {
    await creditWallet({
      userId: order.userId,
      amount: order.summary.total,
      reason,
      referenceId: order._id,
      referenceType: "REFUND",
    });
  }

  // --------------------------------------------------
  // Update Refund
  // --------------------------------------------------

  createdRefund.status = "COMPLETED";
  createdRefund.processedAt = new Date();

  await createdRefund.save({ session });

  // --------------------------------------------------
  // Update Order Payment Status
  // --------------------------------------------------

  order.payment.status = "Refunded";

  await order.save({ session });

  // --------------------------------------------------
  // Send Notification
  // --------------------------------------------------

  await sendNotification({
    userId: order.userId.toString(),
    title: "Order Refunded",
    message: `Your order has been refunded. Reason: ${reason}.`,
    type: "refund",
  });

  return createdRefund;
};
