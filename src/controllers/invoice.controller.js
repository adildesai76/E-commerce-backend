// controllers/invoice.controller.js

import Order from "../models/Order.js";
import AdminStore from "../models/AdminSetting.js";
import { generateInvoicePDF } from "../services/invoice.service.js";

export const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.id,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const store = await AdminStore.findOne().lean();

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store settings not found.",
      });
    }

    await generateInvoicePDF({
      order,
      store,
      res,
    });
  } catch (error) {
    console.error("Download Invoice Error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate invoice.",
      });
    }
  }
};

export const downloadAdminInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const store = await AdminStore.findOne().lean();

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store settings not found.",
      });
    }

    await generateInvoicePDF({
      order,
      store,
      res,
    });
  } catch (error) {
    console.error("Download Admin Invoice Error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate invoice.",
      });
    }
  }
};