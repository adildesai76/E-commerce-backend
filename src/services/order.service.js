import mongoose from "mongoose";

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Cart from "../models/Cart.js";

import { sendNotification } from "../utils/sendNotification.js";

export const finalizeOrder = async ({
  orderId,
  paymentStatus = "Paid",
  orderStatus = "Confirmed",
  transactionId = "",
  paymentMethod = "",
  session = null,
}) => {
  const ownSession = !session;

  if (ownSession) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      throw new Error("Order not found.");
    }

    // -----------------------------
    // Idempotent
    // -----------------------------
    // if (order.status === "Confirmed") {
    //   if (ownSession) {
    //     await session.commitTransaction();
    //     session.endSession();
    //   }

    //   return order;
    // }

    if (order.payment.status === "Paid") {
      if (ownSession) {
        await session.commitTransaction();
        session.endSession();
      }

      return order;
    }
    // -----------------------------
    // Reduce Stock
    // -----------------------------
    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        throw new Error(`${item.name} not found.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Only ${product.stock} ${product.name} left in stock.`);
      }

      product.stock -= item.quantity;

      await product.save({ session });
    }

    // -----------------------------
    // Increment Coupon Usage
    // -----------------------------
    if (order.appliedCoupon?.code) {
      await Coupon.findOneAndUpdate(
        {
          code: order.appliedCoupon.code,
        },
        {
          $inc: {
            usedCount: 1,
          },
        },
        {
          session,
        },
      );
    }

    // -----------------------------
    // Clear Cart
    // -----------------------------
    const cart = await Cart.findOne({
      userId: order.userId,
    }).session(session);

    if (cart) {
      cart.items = [];
      cart.appliedCoupon = null;

      await cart.save({ session });
    }

    // -----------------------------
    // Update Order
    // -----------------------------
    order.status = orderStatus;
    order.payment.status = paymentStatus;

    if (paymentMethod) {
      order.payment.method = paymentMethod.toUpperCase();
    }

    if (transactionId) {
      order.payment.transactionId = transactionId;
    }

    await order.save({ session });

    if (ownSession) {
      await session.commitTransaction();
      session.endSession();
    }

    // -----------------------------
    // Notification
    // -----------------------------
    await sendNotification({
      userId: order.userId,
      title: "Order Placed",
      message: `Your order #${order.orderNumber} has been placed successfully.`,
      type: "order",
      link: `/orders/${order._id}`,
      metadata: {
        orderId: order._id,
      },
    });

    return order;
  } catch (error) {
    if (ownSession) {
      await session.abortTransaction();
      session.endSession();
    }

    throw error;
  }
};
