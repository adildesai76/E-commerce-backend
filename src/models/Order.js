import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    discountPrice: {
      type: Number,
      default: null,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const ShippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address1: {
      type: String,
      required: true,
    },

    address2: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    pincode: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const PaymentSchema = new mongoose.Schema(
  {
    gateway: {
      type: String,
      enum: ["COD", "STRIPE", "RAZORPAY"],
      default: "COD",
    },

    method: {
      type: String,
      enum: ["COD", "RAZORPAY", "STRIPE"],
      default: "COD",
    },

    status: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    transactionId: {
      type: String,
      default: "",
    },
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

const SummarySchema = new mongoose.Schema(
  {
    subtotal: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      required: true,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },

    itemCount: {
      type: Number,
      required: true,
    },

    couponDiscount: {
      type: Number,
      required: true,
      default: 0,
    },

    savings: {
      type: Number,
      required: true,
      default: 0,
    },

    deliveryCharge: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },

    items: {
      type: [OrderItemSchema],
      required: true,
    },

    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },

    payment: {
      type: PaymentSchema,
      required: true,
    },

    summary: {
      type: SummarySchema,
      required: true,
    },

    appliedCoupon: {
      type: AppliedCouponSchema,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Out For Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },
    marketing: {
      source: {
        type: String,
        default: "Direct",
      },

      medium: {
        type: String,
        default: "",
      },

      campaign: {
        type: String,
        default: "",
      },

      referrer: {
        type: String,
        default: "",
      },
    },
    invoice: {
      invoiceNumber: {
        type: String,
        default: "",
      },

      issuedAt: {
        type: Date,
        default: null,
      },
    },
  },

  {
    timestamps: true,
  },
);

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

export default Order;
