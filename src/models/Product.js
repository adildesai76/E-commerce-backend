import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
    },

    sku: {
      type: String,
      default: "",
    },

    images: {
      type: [String],
      default: [],
    },

    featured: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["draft", "active", "out_of_stock"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Product", productSchema);
