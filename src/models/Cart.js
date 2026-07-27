// models/Cart.js

import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: null },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    stock: { type: Number, required: true },
    category: { type: String, required: true },
  },
  { _id: false },
);

const AppliedCouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: {
      type: [CartItemSchema],
      default: [],
    },

    appliedCoupon: {
      type: AppliedCouponSchema,
      default: null,
    },
  },
  { timestamps: true },
);

const Cart = mongoose.models.Cart || mongoose.model("Cart", CartSchema);

export default Cart;
