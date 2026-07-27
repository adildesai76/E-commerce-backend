import Order from "../models/Order.js";
import stripe from "../config/stripe.js";
import { finalizeOrder } from "../services/order.service.js";
import Stripe from "stripe";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";

export const createStripePaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const amount = Math.round(order.summary.total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "inr",

      metadata: {
        orderId: order._id.toString(),
      },
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe Payment Intent Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const stripeWebhook = async (req, res) => {
  let event;

  try {
    const signature = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook verification failed:", err.message);

    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        console.log("STRIPE EVENT:", event.type);

        console.log("ORDER ID:", event.data.object.metadata.orderId);

        const paymentIntent = event.data.object;

        await finalizeOrder({
          orderId: paymentIntent.metadata.orderId,

          paymentStatus: "Paid",

          orderStatus: "Confirmed",

          transactionId: paymentIntent.id,

          //   paymentMethod: paymentIntent.payment_method_types?.[0],
          paymentMethod: "STRIPE",
        });

        break;
      }

      case "payment_intent.payment_failed": {
        console.log("Payment Failed:", event.data.object.id);

        break;
      }

      default:
        console.log(`Unhandled event ${event.type}`);
    }

    res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.payment.gateway !== "RAZORPAY") {
      return res.status(400).json({
        success: false,
        message: "Order is not a Razorpay order.",
      });
    }

    if (order.payment.status === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid.",
      });
    }

    const amount = Math.round(order.summary.total * 100); // paise

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        userId: order.userId.toString(),
      },
    });

    return res.status(200).json({
      success: true,
      order: razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.error?.description ||
        error?.message ||
        "Failed to create Razorpay order.",
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details.",
      });
    }

    // -----------------------------
    // Verify Signature
    // -----------------------------
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    // -----------------------------
    // Finalize Order
    // -----------------------------
    await finalizeOrder({
      orderId,
      paymentStatus: "Paid",
      orderStatus: "Confirmed",
      transactionId: razorpay_payment_id,
      paymentMethod: "RAZORPAY",
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
    });
  } catch (error) {
    console.error("Verify Razorpay Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed.",
    });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    const event = req.body;

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;

        const orderId = payment.notes?.orderId;

        if (orderId) {
          await finalizeOrder({
            orderId,
            paymentStatus: "Paid",
            orderStatus: "Confirmed",
            transactionId: payment.id,
            paymentMethod: "RAZORPAY",
          });
        }

        break;
      }

      default:
        console.log(`Unhandled Razorpay event: ${event.event}`);
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
