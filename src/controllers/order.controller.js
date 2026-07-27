import Order from "../models/Order.js";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import AdminStore from "../models/AdminSetting.js";

import mongoose from "mongoose";

import {
  createOrderSchema,
  orderIdSchema,
  updateOrderStatusSchema,
} from "../validators/order.validations.js";
import { sendNotification } from "../utils/sendNotification.js";
import { finalizeOrder } from "../services/order.service.js";

import { processRefund } from "../services/refund.services.js";
import { generateInvoiceNumber } from "../utils/generateInvoiceNumber.js";

const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const validatedData = createOrderSchema.parse(req.body);

    const { addressId, paymentMethod, marketing } = validatedData;

    // -----------------------------
    // User
    // -----------------------------
    const user = await User.findById(req.user.id).session(session);

    if (!user) {
      throw new Error("User not found");
    }

    // -----------------------------
    // Store Settings
    // -----------------------------
    const accept_orders = await AdminStore.findOne()
      .select("acceptOrders maintenance")
      .session(session)
      .lean();

    if (!accept_orders) {
      throw new Error("Store settings not found");
    }

    if (accept_orders.maintenance?.enabled) {
      throw new Error(
        "Orders cannot be placed while the store is under maintenance.",
      );
    }

    if (!accept_orders.acceptOrders) {
      throw new Error("The store is currently not accepting orders.");
    }

    // -----------------------------
    // Cart
    // -----------------------------
    const cart = await Cart.findOne({
      userId: req.user.id,
    }).session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // -----------------------------
    // Store Shipping Settings
    // -----------------------------
    const store = await AdminStore.findOne()
      .select("shipping")
      .session(session)
      .lean();

    // -----------------------------
    // Address
    // -----------------------------
    const selectedAddress = user.addresses.id(addressId);

    if (!selectedAddress) {
      throw new Error("Address not found");
    }

    const orderItems = [];

    let subtotal = 0;
    let total = 0;
    let itemCount = 0;

    // -----------------------------
    // Validate Products
    // -----------------------------
    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId).session(
        session,
      );

      if (!product) {
        throw new Error(`${cartItem.name} not found`);
      }

      if (product.status !== "active") {
        throw new Error(`${product.name} is not available`);
      }

      if (product.stock < cartItem.quantity) {
        throw new Error(`Only ${product.stock} ${product.name} left in stock`);
      }

      const sellingPrice =
        product.discountPrice > 0 ? product.discountPrice : product.price;

      orderItems.push({
        productId: product._id,
        name: product.name,
        image: product.images[0] || "",
        category: product.category,
        price: product.price,
        discountPrice: product.discountPrice,
        quantity: cartItem.quantity,
      });

      subtotal += product.price * cartItem.quantity;
      total += sellingPrice * cartItem.quantity;
      itemCount += cartItem.quantity;
    }

    // -----------------------------
    // Coupon Validation
    // -----------------------------
    let couponDiscount = 0;
    let appliedCoupon = null;

    if (cart.appliedCoupon?.code) {
      const coupon = await Coupon.findOne({
        code: cart.appliedCoupon.code,
      }).session(session);

      if (!coupon) {
        throw new Error("Applied coupon no longer exists.");
      }

      const now = new Date();

      if (coupon.status !== "active") {
        throw new Error("Coupon is inactive.");
      }

      if (coupon.startDate > now) {
        throw new Error("Coupon is not active yet.");
      }

      if (coupon.expiryDate < now) {
        throw new Error("Coupon has expired.");
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new Error("Coupon usage limit reached.");
      }

      if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
        throw new Error(
          `Minimum order amount is ₹${coupon.minimumOrderAmount}.`,
        );
      }

      // Product validation
      if (coupon.appliesTo === "products") {
        const valid = orderItems.some((item) =>
          coupon.products.some(
            (id) => id.toString() === item.productId.toString(),
          ),
        );

        if (!valid) {
          throw new Error("Coupon is not applicable to selected products.");
        }
      }

      // Category validation
      if (coupon.appliesTo === "categories") {
        const valid = orderItems.some((item) =>
          coupon.categories.includes(item.category),
        );

        if (!valid) {
          throw new Error("Coupon is not applicable to selected categories.");
        }
      }

      // Recalculate Discount
      if (coupon.type === "percentage") {
        couponDiscount = (subtotal * coupon.value) / 100;

        if (
          coupon.maximumDiscount > 0 &&
          couponDiscount > coupon.maximumDiscount
        ) {
          couponDiscount = coupon.maximumDiscount;
        }
      } else {
        couponDiscount = coupon.value;
      }

      couponDiscount = Math.min(couponDiscount, total);

      appliedCoupon = {
        code: coupon.code,
        discount: couponDiscount,
      };
    }

    // -----------------------------
    // Calculate Delivery Charge
    // -----------------------------
    const discountedTotal = Math.max(total - couponDiscount, 0);

    let deliveryCharge = 0;

    const shipping = store?.shipping;

    if (shipping?.enabled) {
      if (
        shipping.freeShipping &&
        discountedTotal >= shipping.freeShippingAmount
      ) {
        deliveryCharge = 0;
      } else {
        deliveryCharge = shipping.defaultCharge ?? 0;
      }
    }

    // -----------------------------
    // Final Order Total
    // -----------------------------
    const finalTotal = discountedTotal + deliveryCharge;

    const productDiscount = subtotal - total;

    const totalSavings = productDiscount + couponDiscount;

    const invoiceNumber = await generateInvoiceNumber();
    // -----------------------------
    // Create Order
    // -----------------------------
    const order = await Order.create(
      [
        {
          userId: user._id,

          orderNumber: generateOrderNumber(),

          items: orderItems,

          invoice: {
            invoiceNumber,
            issuedAt: new Date(),
          },

          shippingAddress: {
            fullName: selectedAddress.fullName,
            phone: selectedAddress.phone,
            address1: selectedAddress.address1,
            address2: selectedAddress.address2,
            city: selectedAddress.city,
            state: selectedAddress.state,
            country: selectedAddress.country,
            pincode: selectedAddress.pincode,
          },

          payment: {
            gateway: paymentMethod,
            method: paymentMethod,
            status: "Pending",
          },

          marketing: {
            source: marketing?.source || "Direct",
            medium: marketing?.medium || "",
            campaign: marketing?.campaign || "",
            referrer: marketing?.referrer || "",
          },

          summary: {
            subtotal,
            discount: productDiscount,
            couponDiscount,
            deliveryCharge,
            total: finalTotal,
            itemCount,
            savings: totalSavings,
          },

          appliedCoupon,
        },
      ],
      { session },
    );

    // -----------------------------
    // Commit Transaction
    // -----------------------------
    await session.commitTransaction();

    const createdOrder = order[0];

    // -----------------------------
    // COD Order Finalization
    // -----------------------------
    if (paymentMethod === "COD") {
      await finalizeOrder({
        orderId: createdOrder._id,
        paymentStatus: "Pending",
        orderStatus: "Confirmed",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        paymentMethod === "COD"
          ? "Order placed successfully."
          : "Order created successfully.",
      order: createdOrder,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to place order.",
    });
  } finally {
    await session.endSession();
  }
};
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.id,
    })
      .select("-marketing")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const {
      params: { orderId },
    } = orderIdSchema.parse({
      params: req.params,
    });

    const query = Order.findById(orderId).populate("userId", "name email");

    // Hide marketing details from customers
    if (req.user.role !== "admin") {
      query.select("-marketing");
    }

    const order = await query.lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Customer can only view their own order
    if (
      req.user.role !== "admin" &&
      order.userId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Get Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};
export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      params: { orderId },
    } = orderIdSchema.parse({
      params: req.params,
    });

    const order = await Order.findById(orderId).session(session);

    if (!order) {
      throw new Error("Order not found");
    }

    // Customer can only cancel their own orders
    if (req.user.role !== "admin" && order.userId.toString() !== req.user.id) {
      throw new Error("Unauthorized");
    }

    // Prevent duplicate cancellation
    if (order.status === "Cancelled") {
      throw new Error("Order is already cancelled");
    }

    // Prevent cancellation after shipping
    if (["Shipped", "Out For Delivery", "Delivered"].includes(order.status)) {
      throw new Error(
        `Order cannot be cancelled because it is ${order.status}.`,
      );
    }

    // -----------------------------
    // Restore Stock
    // -----------------------------
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            stock: item.quantity,
          },
        },
        { session },
      );
    }

    // -----------------------------
    // Cancel Order
    // -----------------------------
    order.status = "Cancelled";

    await order.save({ session });

    // -----------------------------
    // Automatic Refund
    // Only if payment is already received
    // -----------------------------
    console.log("Payment Status:", order.payment.status);
    console.log("Payment Gateway:", order.payment.gateway);
    if (order.payment.status === "Paid") {
      // console.log("Automatic Refund Initiated");
      await processRefund({
        order,
        reason: "Order cancelled by customer",
        session,
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message:
        order.payment.status === "Paid"
          ? "Order cancelled and refund initiated successfully."
          : "Order cancelled successfully.",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel order.",
    });
  }
};
