import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 1,
    },

    minimumOrderAmount: {
      type: Number,
      default: 0,
    },

    maximumDiscount: {
      type: Number,
      default: 0,
    },

    usageLimit: {
      type: Number,
      default: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive" , "expired", "scheduled" ,"deleted"],
      default: "active",
    },

    appliesTo: {
      type: String,
      enum: ["all", "products", "categories"],
      default: "all",
    },

    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    categories: [
      {
        type: String,
      },
    ],

    startDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Coupon =
  mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

export default Coupon;