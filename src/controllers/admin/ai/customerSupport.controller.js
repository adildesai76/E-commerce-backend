import mongoose from "mongoose";

import Order from "../../../models/Order.js";

import { generateCustomerSupportResponseAI } from "../../../services/ai/customerSupportAI.service.js";

const ORDER_INTENT_KEYWORDS =
  /\b(order|package|shipment|shipping|delivery|delivered|dispatch|tracking|refund|cancel|payment|invoice|item|product|bought|purchased|status)\b/i;

const ORDER_FIELDS = `
  orderNumber
  status
  items
  summary
  payment
  appliedCoupon
  shippingAddress
  invoice
  createdAt
  updatedAt
`;

export const askCustomerSupportAI = async (req, res) => {
  try {
    const {
      message,
      conversationHistory = [],
      orderId,
    } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const userId = req.user?._id ?? req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorised",
      });
    }

    let order = null;

    /*
    |--------------------------------------------------------------------------
    | 1. Check for an explicit order reference
    |--------------------------------------------------------------------------
    */

    let orderReference = (orderId?.trim() || "").replace(/^#/, "");

    if (!orderReference) {
      const match = message.match(/#?(ORD[-\w]+)/i);

      if (match) {
        orderReference = match[1].replace(/^#/, "");
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Fetch a specific order only if it belongs to the authenticated user
    |--------------------------------------------------------------------------
    */

    if (orderReference) {
      const orderQuery = {
        userId,
      };

      if (mongoose.Types.ObjectId.isValid(orderReference)) {
        orderQuery.$or = [
          { orderNumber: orderReference },
          { _id: orderReference },
        ];
      } else {
        orderQuery.orderNumber = orderReference;
      }

      order = await Order.findOne(orderQuery)
        .select(ORDER_FIELDS)
        .lean();
    }

    /*
    |--------------------------------------------------------------------------
    | 3. If no specific order was requested, fetch the user's latest order
    |--------------------------------------------------------------------------
    */

    if (!order && ORDER_INTENT_KEYWORDS.test(message)) {
      order = await Order.findOne({ userId })
        .sort({ createdAt: -1 })
        .select(ORDER_FIELDS)
        .lean();
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Prepare only the required order context
    |--------------------------------------------------------------------------
    */

    const customerContext = order
      ? {
          order: formatOrder(order),
        }
      : {
          order: null,
        };

    /*
    |--------------------------------------------------------------------------
    | 5. Generate AI response
    |--------------------------------------------------------------------------
    */

    const response = await generateCustomerSupportResponseAI({
      message,
      conversationHistory,
      customerContext,
    });

    return res.status(200).json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error) {
    console.error("Customer Support AI Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to process customer support request",
    });
  }
};

function formatOrder(order) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    shippingAddress: order.shippingAddress,

    items: order.items?.map((item) => ({
      product: item.product,
      name: item.name,
      category: item.category,
      price: item.price,
      discountPrice: item.discountPrice,
      quantity: item.quantity,
    })),

    summary: order.summary,

    payment: {
      gateway: order.payment?.gateway,
      method: order.payment?.method,
      status: order.payment?.status,
    },

    appliedCoupon: order.appliedCoupon ?? null,

    invoice: order.invoice
      ? {
          invoiceNumber: order.invoice.invoiceNumber,
          issuedAt: order.invoice.issuedAt,
        }
      : null,
  };
}