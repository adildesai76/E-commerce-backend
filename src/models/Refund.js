import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"],
      default: "REQUESTED",
    },

    refundMethod: {
      type: String,
      enum: ["WALLET", "STRIPE", "RAZORPAY"],
      required: true,
    },

    processedAt: {
      type: Date,
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Refund", refundSchema);
