import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
    },

    buttonText: {
      type: String,
      default: "",
    },

    buttonLink: {
      type: String,
      default: "",
    },

    active: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const AdminStoreSchema = new mongoose.Schema(
  {
    // ==========================
    // Store Information
    // ==========================
    storeName: {
      type: String,
      required: true,
      default: "My Store",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    banners: {
      type: [BannerSchema],
      default: [],
    },

    // ==========================
    // Contact Information
    // ==========================
    contact: {
      email: {
        type: String,
        default: "",
        lowercase: true,
        trim: true,
      },

      phone: {
        type: String,
        default: "",
      },

      whatsapp: {
        type: String,
        default: "",
      },
    },

    // ==========================
    // Business Address
    // ==========================
    address: {
      street: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        default: "",
      },

      state: {
        type: String,
        default: "",
      },

      country: {
        type: String,
        default: "",
      },

      pincode: {
        type: String,
        default: "",
      },
    },

    // ==========================
    // Tax
    // ==========================
    tax: {
      gstNumber: {
        type: String,
        default: "",
      },

      vatNumber: {
        type: String,
        default: "",
      },

      taxEnabled: {
        type: Boolean,
        default: false,
      },

      taxRate: {
        type: Number,
        default: 0,
      },
    },

    // ==========================
    // Shipping
    // ==========================
    shipping: {
      enabled: {
        type: Boolean,
        default: true,
      },

      defaultCharge: {
        type: Number,
        default: 0,
      },

      freeShipping: {
        type: Boolean,
        default: false,
      },

      freeShippingAmount: {
        type: Number,
        default: 0,
      },

      estimatedDeliveryDays: {
        type: Number,
        default: 5,
      },
    },

    // ==========================
    // Localization
    // ==========================
    currency: {
      code: {
        type: String,
        default: "INR",
      },

      symbol: {
        type: String,
        default: "₹",
      },
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    // ==========================
    // Social Links
    // ==========================
    socialLinks: {
      facebook: {
        type: String,
        default: "",
      },

      instagram: {
        type: String,
        default: "",
      },

      twitter: {
        type: String,
        default: "",
      },

      linkedin: {
        type: String,
        default: "",
      },

      youtube: {
        type: String,
        default: "",
      },
    },

    // ==========================
    // Business
    // ==========================
    business: {
      businessName: {
        type: String,
        default: "",
      },

      supportEmail: {
        type: String,
        default: "",
      },

      supportPhone: {
        type: String,
        default: "",
      },
    },

    // ==========================
    // SEO
    // ==========================
    seo: {
      metaTitle: {
        type: String,
        default: "",
      },

      metaDescription: {
        type: String,
        default: "",
      },

      metaKeywords: {
        type: String,
        default: "",
      },

      ogImage: {
        type: String,
        default: "",
      },
    },

    // ==========================
    // Maintenance
    // ==========================
    maintenance: {
      enabled: {
        type: Boolean,
        default: false,
      },

      message: {
        type: String,
        default: "",
      },
    },

    // ==========================
    // Invoice
    // ==========================
    invoice: {
      prefix: {
        type: String,
        default: "INV",
      },

      footer: {
        type: String,
        default: "",
      },

      signature: {
        type: String,
        default: "",
      },

      stamp: {
        type: String,
        default: "",
      },
    },

    // ==========================
    // Returns
    // ==========================
    returns: {
      returnDays: {
        type: Number,
        default: 7,
      },

      replacementDays: {
        type: Number,
        default: 7,
      },
    },

    // ==========================
    // Store Status
    // ==========================
    acceptOrders: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const AdminStore =
  mongoose.models.AdminStore ||
  mongoose.model("AdminStore", AdminStoreSchema);

export default AdminStore;