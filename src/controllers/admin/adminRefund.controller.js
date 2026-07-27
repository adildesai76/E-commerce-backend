import Refund from "../../models/Refund.js";
import { processRefund } from "../../services/refund.services.js";
import Order from "../../models/Order.js";

export const getRefunds = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      refundMethod,
      search = "",
    } = req.query;

    const query = {};

    // Filter by refund status
    if (status) {
      query.status = status;
    }

    // Filter by refund method
    if (refundMethod) {
      query.refundMethod = refundMethod;
    }

    // Search by order number (requires finding matching orders)
    if (search.trim()) {
      const orders = await Order.find({
        orderNumber: {
          $regex: search,
          $options: "i",
        },
      }).select("_id");

      query.orderId = {
        $in: orders.map((order) => order._id),
      };
    }

    const total = await Refund.countDocuments(query);

    const refunds = await Refund.find(query)
      .populate("userId", "name email")
      .populate("orderId", "orderNumber summary payment status")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      refunds,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
        hasPrevPage: Number(page) > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveRefund = async (req, res) => {
  try {
    const refund = await processRefund({
      refundId: req.params.id,
    });

    res.json({
      success: true,
      message: "Refund completed",
      refund,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectRefund = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id);

    if (!refund) {
      throw new Error("Refund not found");
    }

    refund.status = "REJECTED";

    await refund.save();

    res.json({
      success: true,
      message: "Refund rejected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
