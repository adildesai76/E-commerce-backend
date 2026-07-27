import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
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

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    referenceType: {
      type: String,
      enum: [
        "ORDER",
        "REFUND",
        "PAYMENT",
      ],
    },
  },
  {
    timestamps: true,
  }
);


const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
    },

    transactions: [
      walletTransactionSchema,
    ],
  },
  {
    timestamps: true,
  }
);


export default mongoose.model(
  "Wallet",
  walletSchema
);